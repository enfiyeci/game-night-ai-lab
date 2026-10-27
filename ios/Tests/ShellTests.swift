import Foundation
import Testing
@testable import GameNight

struct ByteRangeTests {
    @Test func openEndedRangeRunsToTheEnd() {
        #expect(BundleSchemeHandler.byteRange("bytes=0-", length: 100) == 0..<100)
        #expect(BundleSchemeHandler.byteRange("bytes=40-", length: 100) == 40..<100)
    }

    @Test func closedRangeIncludesItsLastByte() {
        #expect(BundleSchemeHandler.byteRange("bytes=0-1", length: 100) == 0..<2)
    }

    @Test func endPastTheFileIsClamped() {
        #expect(BundleSchemeHandler.byteRange("bytes=90-500", length: 100) == 90..<100)
    }

    @Test func suffixRangeTakesTheLastBytes() {
        #expect(BundleSchemeHandler.byteRange("bytes=-10", length: 100) == 90..<100)
        #expect(BundleSchemeHandler.byteRange("bytes=-500", length: 100) == 0..<100)
    }

    @Test func unusableRangesAreIgnored() {
        #expect(BundleSchemeHandler.byteRange("bytes=100-", length: 100) == nil)
        #expect(BundleSchemeHandler.byteRange("bytes=5-2", length: 100) == nil)
        #expect(BundleSchemeHandler.byteRange("bytes=0-1,5-6", length: 100) == nil)
        #expect(BundleSchemeHandler.byteRange("items=0-1", length: 100) == nil)
        #expect(BundleSchemeHandler.byteRange("bytes=0-abc", length: 100) == nil)
        #expect(BundleSchemeHandler.byteRange("bytes=0-", length: 0) == nil)
    }
}

@MainActor
struct SchemePathTests {
    private let root = FileManager.default.temporaryDirectory.appending(path: "web-\(UUID().uuidString)")

    private func handler() throws -> BundleSchemeHandler {
        try FileManager.default.createDirectory(at: root.appending(path: "ui"), withIntermediateDirectories: true)
        try Data("x".utf8).write(to: root.appending(path: "ui/a.js"))
        return BundleSchemeHandler(root: root)
    }

    @Test func servesFilesInsideTheWebFolder() throws {
        let h = try handler()
        #expect(h.fileURL(for: URL(string: "gamenight://app/ui/a.js")!)?.lastPathComponent == "a.js")
        #expect(h.fileURL(for: URL(string: "gamenight://app/")!)?.lastPathComponent == "index.html")
    }

    @Test func refusesPathsOutsideItAndOtherHosts() throws {
        let h = try handler()
        #expect(h.fileURL(for: URL(string: "gamenight://app/../secret.txt")!) == nil)
        #expect(h.fileURL(for: URL(string: "gamenight://app/ui/../../secret.txt")!) == nil)
        #expect(h.fileURL(for: URL(string: "gamenight://other/ui/a.js")!) == nil)
        #expect(h.fileURL(for: URL(string: "https://app/ui/a.js")!) == nil)
    }

    @Test func refusesASymbolicLinkThatLeavesTheFolder() throws {
        let h = try handler()
        let outside = FileManager.default.temporaryDirectory.appending(path: "outside-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: outside, withIntermediateDirectories: true)
        try Data("secret".utf8).write(to: outside.appending(path: "secret.txt"))
        try FileManager.default.createSymbolicLink(at: root.appending(path: "ui/out"), withDestinationURL: outside)
        #expect(h.fileURL(for: URL(string: "gamenight://app/ui/out/secret.txt")!) == nil)
    }
}

@MainActor
struct SaveStoreTests {
    private func temporaryFile() -> URL {
        FileManager.default.temporaryDirectory.appending(path: "save-store-\(UUID().uuidString)/storage.json")
    }

    @Test func writesSurviveANewStore() {
        let file = temporaryFile()
        let store = SaveStore(file: file)
        store.apply(["type": "set", "key": "ai-lab-run-counter", "value": "3"])
        store.apply(["type": "set", "key": "flock-theme", "value": "dark"])
        store.apply(["type": "remove", "key": "flock-theme"])
        #expect(SaveStore(file: file).items == ["ai-lab-run-counter": "3"])
    }

    @Test func snapshotAddsMissingKeysAndKeepsTheCopysValues() {
        let store = SaveStore(file: temporaryFile())
        store.apply(["type": "set", "key": "a", "value": "newer"])
        store.apply(["type": "set", "key": "kept", "value": "1"])
        store.apply(["type": "snapshot", "items": ["a": "older", "b": "2"]])
        #expect(store.items == ["a": "newer", "b": "2", "kept": "1"])
    }

    @Test func clearEmptiesTheCopy() {
        let store = SaveStore(file: temporaryFile())
        store.apply(["type": "set", "key": "a", "value": "1"])
        store.apply(["type": "clear"])
        #expect(store.items.isEmpty)
    }

    @Test func malformedMessagesChangeNothing() {
        let store = SaveStore(file: temporaryFile())
        store.apply(["type": "set", "key": "a"])
        store.apply(["type": "unknown"])
        store.apply(["key": "a", "value": "1"])
        #expect(store.items.isEmpty)
    }
}
