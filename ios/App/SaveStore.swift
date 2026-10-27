import Foundation

/// A copy of the game's localStorage (the endings found, settings, the run counter, which intros were
/// seen) kept in the app's own files. iOS can clear a web view's storage under disk pressure, and an
/// app's Application Support folder survives launches and app updates, so the shell restores from
/// here whenever the web view comes up without a key it should have.
@MainActor
final class SaveStore {
    private(set) var items: [String: String]
    private let file: URL
    private var pendingWrite: Task<Void, Never>?

    init(file: URL = SaveStore.defaultFile) {
        self.file = file
        if let data = try? Data(contentsOf: file),
           let saved = try? JSONDecoder().decode([String: String].self, from: data) {
            items = saved
        } else {
            items = [:]
        }
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
            // The page's whole localStorage right after the restore, so it is the newest value of
            // every key it holds. Keys only this copy holds (a restore that failed) stay.
            guard let snapshot = message["items"] as? [String: String] else { return }
            items.merge(snapshot) { _, page in page }
        default:
            return
        }
        scheduleWrite()
    }

    /// Writes now; the app calls this when it goes to the background.
    func flush() {
        pendingWrite?.cancel()
        pendingWrite = nil
        write()
    }

    private func scheduleWrite() {
        pendingWrite?.cancel()
        pendingWrite = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(400))
            guard !Task.isCancelled else { return }
            self?.write()
        }
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
