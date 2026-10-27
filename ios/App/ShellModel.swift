import Foundation
import Observation
import OSLog
import WebKit

let shellLog = Logger(subsystem: "GameNight", category: "shell")

/// What the web game reports for the glance: cash, era and the running training. Built by
/// ui/native/bridge.js from the game's own HUD formatting, so the numbers read the same as the HUD.
struct Glance: Decodable, Equatable {
    struct Training: Decodable, Equatable {
        var name: String
        var status: String
        var progress: Double?
    }

    var labName: String?
    var cash: String
    var era: Int
    var eraName: String
    var training: Training
    var over: Bool
    var inRun: Bool
}

/// How the iPhone Duo is posed. `.none` on every other iPhone and on iPad.
enum Posture: String, Equatable, Sendable {
    case none, closed, open, partial
}

/// The crease of a half-folded Duo, in the web view's points. These are the page's CSS pixels before any
/// `zoom` the page sets on its root (ui/main.js fitToWindow scales them by that zoom).
struct Fold: Equatable, Sendable {
    var frame: CGRect
}

/// State shared by the web view, the Duo layout and the glance.
@MainActor
@Observable
final class ShellModel {
    var glance: Glance?
    var posture: Posture = .none {
        didSet {
            guard posture != oldValue else { return }
            shellLog.info("posture: \(self.posture.rawValue, privacy: .public)")
            sendLayout()
        }
    }
    var fold: Fold? { didSet { if fold != oldValue { sendLayout() } } }
    /// Set when the Duo closes; the glance card shows until the player taps through it.
    var glanceShowing = false

    let saves = SaveStore()
    @ObservationIgnored weak var webView: WKWebView?
    @ObservationIgnored private var inBackground = false

    /// Pauses the game clock and its media when the app leaves the screen, and resumes on return.
    func setBackground(_ background: Bool) {
        guard background != inBackground else { return }
        inBackground = background
        shellLog.info("background: \(background)")
        webView?.setAllMediaPlaybackSuspended(background)
        run("""
        if (globalThis.__gameNightShell) globalThis.__gameNightShell.background = \(background);
        globalThis.gameNightNative?.\(background ? "pause" : "resume")?.();
        """)
    }

    /// Re-sends the posture and crease, for example after the page reloads.
    func sendLayout() {
        var detail: [String: Any] = ["posture": posture.rawValue]
        if let fold {
            detail["fold"] = ["x": fold.frame.minX, "y": fold.frame.minY, "width": fold.frame.width, "height": fold.frame.height]
        } else {
            detail["fold"] = NSNull()
        }
        guard let json = try? JSONSerialization.data(withJSONObject: detail),
              let text = String(data: json, encoding: .utf8) else { return }
        run("globalThis.__gameNightShell?.applyLayout(\(text));")
    }

    func receive(glanceJSON: Any) {
        guard let data = try? JSONSerialization.data(withJSONObject: glanceJSON),
              let glance = try? JSONDecoder().decode(Glance.self, from: data) else { return }
        if glance != self.glance {
            shellLog.info("glance: \(glance.cash, privacy: .public) era \(glance.era) \(glance.training.status, privacy: .public)")
            self.glance = glance
        }
    }

    /// The page asks for the current state once its bridge is ready.
    func pageReady() {
        sendLayout()
        if inBackground { run("globalThis.gameNightNative?.pause?.();") }
    }

    private func run(_ script: String) {
        webView?.evaluateJavaScript(script) { _, error in
            if let error { print("ShellModel: script failed: \(error)") }
        }
    }
}
