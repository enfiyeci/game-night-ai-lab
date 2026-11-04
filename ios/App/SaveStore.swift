import Foundation

/// A copy of the game's localStorage (the endings found, settings, the run counter, which intros were
/// seen) kept in the app's own files. iOS can clear a web view's storage under disk pressure, and an
/// app's Application Support folder survives launches and app updates, so the shell restores from
/// here whenever the web view comes up without a key it should have.
@MainActor
final class SaveStore {
    private(set) var items: [String: String]
    /// Whether this copy is the record: read from the file at launch, or taken from the page since. Once it
    /// is, it decides in both directions, so a key the page removed stays removed even when WebKit had not
    /// written the removal to disk before the app ended.
    private(set) var hasCopy: Bool
    private let file: URL

    init(file: URL = SaveStore.defaultFile) {
        self.file = file
        if let data = try? Data(contentsOf: file),
           let saved = try? JSONDecoder().decode([String: String].self, from: data) {
            items = saved
            hasCopy = true
        } else {
            items = [:]
            hasCopy = false
        }
    }

    /// What the document-start script restores (App/Web/native-shell.js): the copy as a JSON object, or
    /// null while there is no copy yet, so the page keeps what it has.
    var restoreJSON: String {
        guard hasCopy else { return "null" }
        return (try? JSONSerialization.data(withJSONObject: items))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "null"
    }

    nonisolated static var defaultFile: URL {
        URL.applicationSupportDirectory.appending(path: "GameNight/storage.json")
    }

    /// Applies one message from the page's storage mirror (App/Web/native-shell.js).
    func apply(_ message: [String: Any]) {
        switch message["type"] as? String {
        case "set":
            guard let key = message["key"] as? String, let value = message["value"] as? String else { return }
            items[key] = value
        case "remove":
            guard let key = message["key"] as? String else { return }
            items[key] = nil
        case "clear":
            items = [:]
        case "snapshot":
            // The page's localStorage right after the restore. It is taken only while there is no copy
            // (the first launch, or a missing or unreadable file). Otherwise the restore already made the
            // page match this copy, which is written at once on every change, while WebKit writes its
            // storage to disk later.
            guard !hasCopy, let snapshot = message["items"] as? [String: String] else { return }
            items = snapshot
        default:
            return
        }
        hasCopy = true
        // Written at once: the saves are a few short strings and change rarely, and a delayed write
        // could be lost if iOS suspends the app first.
        write()
    }

    private func write() {
        do {
            try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            let data = try JSONEncoder().encode(items)
            try data.write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        } catch {
            print("SaveStore: could not write \(file.path): \(error)")
        }
    }
}
