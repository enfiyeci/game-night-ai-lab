import Foundation
import UniformTypeIdentifiers
import WebKit

/// Serves the bundled web game at `gamenight://app/…`, so pages load with no network and `fetch()`
/// works (WebKit refuses `fetch` and module scripts from plain `file://` pages). Supports byte-range
/// requests, which `<video>` and `<audio>` use for the ending films and the music.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "gamenight"
    static let startURL = URL(string: "\(scheme)://app/index.html")!

    private let root: URL

    init(root: URL) {
        self.root = root.standardizedFileURL.resolvingSymlinksInPath()
    }

    func webView(_ webView: WKWebView, start task: any WKURLSchemeTask) {
        guard let url = task.request.url else {
            task.didFailWithError(URLError(.badURL))
            return
        }
        guard let file = fileURL(for: url), let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            task.didReceive(HTTPURLResponse(url: url, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: ["Content-Length": "0"])!)
            task.didFinish()
            return
        }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        var headers = [
            "Content-Type": mime,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache",
        ]
        var status = 200
        var body = data
        if let range = task.request.value(forHTTPHeaderField: "Range").flatMap({ Self.byteRange($0, length: data.count) }) {
            status = 206
            body = data.subdata(in: range)
            headers["Content-Range"] = "bytes \(range.lowerBound)-\(range.upperBound - 1)/\(data.count)"
        }
        headers["Content-Length"] = "\(body.count)"
        let response = HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: headers)!
        task.didReceive(response)
        task.didReceive(body)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: any WKURLSchemeTask) {}

    /// The file inside the web folder for a request, or nil for anything outside it (symbolic links
    /// are followed before the check).
    func fileURL(for url: URL) -> URL? {
        guard url.scheme == Self.scheme, url.host == "app" else { return nil }
        let path = url.path.isEmpty || url.path == "/" ? "/index.html" : url.path
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL.resolvingSymlinksInPath()
        guard file.path.hasPrefix(root.path + "/") else { return nil }
        return file
    }

    /// Parses a single `bytes=start-end` range (end optional, or a `-suffix`), clamped to the file.
    static func byteRange(_ header: String, length: Int) -> Range<Int>? {
        guard length > 0, header.hasPrefix("bytes="), !header.contains(",") else { return nil }
        let parts = header.dropFirst("bytes=".count).split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 2 else { return nil }
        let start: Int
        let end: Int
        if parts[0].isEmpty {
            guard let suffix = Int(parts[1]), suffix > 0 else { return nil }
            start = max(0, length - suffix)
            end = length - 1
        } else {
            guard let first = Int(parts[0]), first < length else { return nil }
            start = first
            if parts[1].isEmpty {
                end = length - 1
            } else {
                guard let last = Int(parts[1]) else { return nil }
                end = min(last, length - 1)
            }
        }
        guard start <= end else { return nil }
        return start..<(end + 1)
    }
}
