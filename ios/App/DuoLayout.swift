import SwiftUI

extension View {
    /// Tells the model how the iPhone Duo is posed and where the crease is while it is half-folded.
    /// On iOS before 27.1, other iPhones and iPad, the posture stays `.none` and there is no crease.
    @ViewBuilder
    func reportsDuoLayout(to model: ShellModel) -> some View {
        if #available(iOS 27.1, *) {
            self
                .onHingeChange { _, context in
                    model.posture = Posture(context.hinge?.status)
                }
                .onGeometryChange(for: Fold?.self) { proxy in
                    // Read every layout pass: regions arrive after the first one and move with the hinge.
                    proxy.reservedRegions(kind: .division)
                        .first(where: \.isActive)
                        .map { Fold(frame: $0.frame) }
                } action: { fold in
                    model.fold = fold
                }
        } else {
            self
        }
    }
}

@available(iOS 27.1, *)
private extension Posture {
    init(_ status: DeviceHinge.Status?) {
        switch status {
        case nil: self = .none
        case .closed?: self = .closed
        case .partiallyOpen?: self = .partial
        default: self = .open
        }
    }
}
