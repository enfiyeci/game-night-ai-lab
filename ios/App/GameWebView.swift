import SwiftUI
import WebKit

/// The full-screen web view that runs the game. It is created once per scene and never rebuilt, so a
/// fold, an unfold or a rotation only resizes it and the game keeps its state.
struct GameWebView: UIViewRepresentable {
    let model: ShellModel

    func makeCoordinator() -> Coordinator { Coordinator(model: model) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true // the ending films play in the page, not full screen
        configuration.mediaTypesRequiringUserActionForPlayback = [] // the game itself waits for the first tap
        configuration.ignoresViewportScaleLimits = false // the default, kept explicit: the page's maximum-scale=1 turns pinch zoom off
        let webFolder = Bundle.main.url(forResource: "web", withExtension: nil)!
        configuration.setURLSchemeHandler(BundleSchemeHandler(root: webFolder), forURLScheme: BundleSchemeHandler.scheme)

        let controller = configuration.userContentController
        let proxy = MessageProxy(coordinator: context.coordinator)
        controller.add(proxy, name: "gameNight")
        controller.add(proxy, name: "gameNightStorage")
        context.coordinator.installShellScript(on: controller)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(named: "LaunchBackground")
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.allowsLinkPreview = false
        #if DEBUG
        webView.isInspectable = true // Safari › Develop can attach to the simulator
        #endif
        model.webView = webView

        // Block every http and https load, so the app never reaches the network.
        WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "offline", encodedContentRuleList: Self.offlineRules) { list, error in
            if let list { controller.add(list) } else if let error { print("GameWebView: offline rules failed: \(error)") }
            webView.load(URLRequest(url: Self.firstURL))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    /// The start page. Debug builds take `-startQuery "scenario=midEra3"` to open one of the game's
    /// debug scenarios, so a test can begin mid-run.
    private static var firstURL: URL {
        #if DEBUG
        let arguments = ProcessInfo.processInfo.arguments
        if let index = arguments.firstIndex(of: "-startQuery"), index + 1 < arguments.count,
           let url = URL(string: "\(BundleSchemeHandler.startURL.absoluteString)?\(arguments[index + 1])") {
            return url
        }
        #endif
        return BundleSchemeHandler.startURL
    }

    private static let offlineRules = """
    [{"trigger": {"url-filter": "^https?://"}, "action": {"type": "block"}}]
    """

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate {
        let model: ShellModel

        init(model: ShellModel) { self.model = model }

        /// The document-start script with the app's copy of the saves written in. It is rebuilt before
        /// every page load (Play again reloads the page), so a reload never restores stale values.
        func installShellScript(on controller: WKUserContentController) {
            let template = Bundle.main.url(forResource: "native-shell", withExtension: "js")
                .flatMap { try? String(contentsOf: $0, encoding: .utf8) } ?? ""
            let json = (try? JSONSerialization.data(withJSONObject: model.saves.items))
                .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
            controller.removeAllUserScripts()
            let source = template.replacingOccurrences(of: "/*SAVED_ITEMS*/{}", with: json)
            controller.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }

        func receive(_ message: WKScriptMessage) {
            guard let body = message.body as? [String: Any] else { return }
            switch message.name {
            case "gameNightStorage":
                model.saves.apply(body)
            case "gameNight":
                switch body["type"] as? String {
                case "glance": if let glance = body["glance"] { model.receive(glanceJSON: glance) }
                case "ready": model.pageReady()
                default: break
                }
            default:
                break
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction) async -> WKNavigationActionPolicy {
            guard let url = action.request.url, url.scheme == BundleSchemeHandler.scheme || url.scheme == "about" else {
                return .cancel
            }
            if action.targetFrame?.isMainFrame == true {
                installShellScript(on: webView.configuration.userContentController)
            }
            return .allow
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            model.sendLayout()
        }

        /// iOS can end the page's process while the app is in the background. The run in progress is
        /// lost then (the game has no mid-run save); reloading brings the title screen back with the saves.
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.load(URLRequest(url: BundleSchemeHandler.startURL))
        }
    }

    /// Holds the coordinator weakly: WKUserContentController keeps its handlers alive.
    private final class MessageProxy: NSObject, WKScriptMessageHandler {
        weak var coordinator: Coordinator?

        init(coordinator: Coordinator) { self.coordinator = coordinator }

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            coordinator?.receive(message)
        }
    }
}
