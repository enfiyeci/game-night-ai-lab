import SwiftUI

/// The game's palette (ui/styles.css :root), for the native views.
enum Palette {
    static let cream = Color(red: 0xF1 / 255, green: 0xE4 / 255, blue: 0xC8 / 255)
    static let paper = Color(red: 0xFF / 255, green: 0xFB / 255, blue: 0xF1 / 255)
    static let ink = Color(red: 0x2E / 255, green: 0x2A / 255, blue: 0x2B / 255)
    static let teal = Color(red: 0x3F / 255, green: 0x9C / 255, blue: 0x8F / 255)
    static let inkSoft = ink.opacity(0.68)
}

/// The at-a-glance status shown when the iPhone Duo is closed mid-run: cash, era and the running
/// training, read from the game. Optional: one tap goes back to the game on the same display, and
/// opening the phone dismisses it.
struct GlanceView: View {
    let glance: Glance
    let onKeepPlaying: () -> Void

    var body: some View {
        GeometryReader { proxy in
            let wide = proxy.size.width > proxy.size.height * 1.15
            ZStack {
                Palette.cream.ignoresSafeArea()
                Group {
                    if wide {
                        HStack(alignment: .center, spacing: 32) {
                            headline
                            VStack(spacing: 16) { training; button }
                        }
                    } else {
                        VStack(spacing: 24) { headline; training; button }
                    }
                }
                .frame(maxWidth: wide ? 760 : 420)
                .padding(24)
            }
        }
        .foregroundStyle(Palette.ink)
        .accessibilityElement(children: .contain)
    }

    private var headline: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Era \(glance.era) · \(glance.eraName)".uppercased())
                .font(.system(size: 13, weight: .heavy, design: .rounded))
                .tracking(0.6)
                .foregroundStyle(Palette.inkSoft)
            if let lab = glance.labName, !lab.isEmpty {
                Text(lab)
                    .font(.system(size: 24, weight: .bold, design: .serif))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            Text(glance.cash)
                .font(.system(size: 64, weight: .black, design: .rounded))
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .accessibilityLabel("Cash \(glance.cash)")
            Text("cash in the bank")
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(Palette.inkSoft)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var training: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(glance.training.name)
                .font(.system(size: 19, weight: .heavy, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            if let progress = glance.training.progress {
                ProgressBar(value: progress)
                    .accessibilityLabel("Progress")
                    .accessibilityValue("\(Int((progress * 100).rounded())) percent")
            }
            Text(glance.training.status)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(Palette.inkSoft)
                .lineLimit(2)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Palette.paper, in: RoundedRectangle(cornerRadius: 6))
    }

    private var button: some View {
        Button(action: onKeepPlaying) {
            Text("Keep playing")
                .font(.system(size: 18, weight: .heavy, design: .rounded))
                .frame(maxWidth: .infinity, minHeight: 52)
        }
        .buttonStyle(.plain)
        .foregroundStyle(Palette.paper)
        .background(Palette.ink, in: Capsule())
    }
}

private struct ProgressBar: View {
    let value: Double

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(Palette.cream)
                Capsule().fill(Palette.teal)
                    .frame(width: max(10, proxy.size.width * min(1, max(0, value))))
            }
        }
        .frame(height: 10)
    }
}

#Preview("Tall") {
    GlanceView(glance: .sample) {}
        .frame(width: 466, height: 678)
}

#Preview("Wide") {
    GlanceView(glance: .sample) {}
        .frame(width: 678, height: 466)
}

extension Glance {
    static let sample = Glance(labName: "Tinker Labs", cash: "$1.2B", era: 3, eraName: "Reasoning and agents",
                               training: .init(name: "Tinker-4", status: "training run · midtraining", progress: 0.46), over: false, inRun: true)
}
