import AVFoundation
import SwiftUI

@main
struct GameNightApp: App {
    init() {
        // Game music: mixes with the player's own audio and follows the silent switch.
        try? AVAudioSession.sharedInstance().setCategory(.ambient)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

struct RootView: View {
    @State private var model = ShellModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ZStack {
            GameWebView(model: model)
                .ignoresSafeArea()
                .reportsDuoLayout(to: model)
                .accessibilityHidden(model.glanceShowing)
            if model.glanceShowing, let glance = model.glance {
                GlanceView(glance: glance) { model.glanceShowing = false }
                    .transition(.opacity)
            }
        }
        .background(Color("LaunchBackground"))
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
        .defersSystemGestures(on: .bottom)
        .animation(.easeOut(duration: 0.2), value: model.glanceShowing)
        .onChange(of: scenePhase, initial: true) { _, phase in
            model.setBackground(phase != .active)
        }
        .onChange(of: model.posture) { old, new in
            // Closing the Duo mid-run offers the glance; opening it again goes straight back to the game.
            if new == .closed, old != .closed, model.glance?.inRun == true { model.glanceShowing = true }
            if new != .closed { model.glanceShowing = false }
        }
        .onChange(of: model.glance?.inRun) { _, inRun in
            // The run ended (the ending film starts) or went back to the title: show the game.
            if inRun != true { model.glanceShowing = false }
        }
        #if DEBUG
        .task { await playDebugPostures() }
        #endif
    }

    #if DEBUG
    /// Debug builds only: `-debugPostures closed@25,open@45` sets those postures that many seconds
    /// after launch, for testing the glance and the page's posture events where no hinge can be moved.
    private func playDebugPostures() async {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: "-debugPostures"), index + 1 < arguments.count else { return }
        var elapsed = 0
        for step in arguments[index + 1].split(separator: ",") {
            let parts = step.split(separator: "@")
            guard parts.count == 2, let posture = Posture(rawValue: String(parts[0])), let at = Int(parts[1]) else { continue }
            try? await Task.sleep(for: .seconds(max(0, at - elapsed)))
            elapsed = at
            model.posture = posture
        }
    }
    #endif
}
