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
        #expect(BundleSchemeHandler.byteRange("bytes=0-", length: 0) == nil)
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
        store.flush()
        #expect(SaveStore(file: file).items == ["ai-lab-run-counter": "3"])
    }

    @Test func snapshotTakesThePageValuesAndKeepsKeysOnlyTheCopyHas() {
        let store = SaveStore(file: temporaryFile())
        store.apply(["type": "set", "key": "a", "value": "old"])
        store.apply(["type": "set", "key": "kept", "value": "1"])
        store.apply(["type": "snapshot", "items": ["a": "new", "b": "2"]])
        #expect(store.items == ["a": "new", "b": "2", "kept": "1"])
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
