// Regenerates build/icon.png — the crime-themed app icon (a fedora over the WiFi
// arcs with a gold $ coin). Run: swift make-icon.swift  (from the build/ dir).
import AppKit

let S: CGFloat = 1024
func L(_ v: CGFloat) -> CGFloat { v / 100 * S }                 // design units (0..100) → px
func P(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: L(x), y: L(100 - y)) } // flip Y (CG is bottom-up)

let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(S), pixelsHigh: Int(S),
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let ctx = NSGraphicsContext.current!.cgContext
let cs = CGColorSpaceCreateDeviceRGB()

// background: rounded rect, deep-navy vertical gradient
let bg = CGPath(roundedRect: CGRect(x: L(2), y: L(2), width: L(96), height: L(96)),
                cornerWidth: L(23), cornerHeight: L(23), transform: nil)
ctx.saveGState(); ctx.addPath(bg); ctx.clip()
let grad = CGGradient(colorsSpace: cs, colors: [
    CGColor(red: 0.11, green: 0.17, blue: 0.34, alpha: 1),
    CGColor(red: 0.03, green: 0.05, blue: 0.12, alpha: 1)] as CFArray, locations: [0, 1])!
ctx.drawLinearGradient(grad, start: CGPoint(x: 0, y: S), end: .zero, options: [])
ctx.restoreGState()

// WiFi arcs (green domes)
func dome(_ y: CGFloat, _ spread: CGFloat, _ rise: CGFloat) {
    let p = CGMutablePath()
    p.move(to: P(50 - spread, y))
    p.addQuadCurve(to: P(50, y - rise), control: P(50 - spread / 2, y - rise))
    p.addQuadCurve(to: P(50 + spread, y), control: P(50 + spread / 2, y - rise))
    ctx.addPath(p); ctx.strokePath()
}
ctx.setStrokeColor(CGColor(red: 0.30, green: 0.87, blue: 0.50, alpha: 1))
ctx.setLineCap(.round); ctx.setLineWidth(L(6.5))
dome(71, 21, 12)
dome(80, 12, 7)

// fedora
ctx.setFillColor(CGColor(red: 0.06, green: 0.06, blue: 0.08, alpha: 1))  // brim
ctx.fillEllipse(in: CGRect(x: L(18), y: L(100 - 46 - 7.5), width: L(64), height: L(15)))
let crown = CGMutablePath()                                              // crown
crown.move(to: P(33, 46))
crown.addCurve(to: P(50, 24), control1: P(33, 33), control2: P(38, 24))
crown.addCurve(to: P(67, 46), control1: P(62, 24), control2: P(67, 33))
crown.closeSubpath()
ctx.setFillColor(CGColor(red: 0.11, green: 0.11, blue: 0.14, alpha: 1))
ctx.addPath(crown); ctx.fillPath()
ctx.setFillColor(CGColor(red: 0.54, green: 0.12, blue: 0.16, alpha: 1))  // blood-red band
ctx.fill(CGRect(x: L(33), y: L(100 - 46), width: L(34), height: L(6)))

// gold $ coin
ctx.setFillColor(CGColor(red: 1.0, green: 0.78, blue: 0.24, alpha: 1))
ctx.fillEllipse(in: CGRect(x: L(50 - 10), y: L(100 - 86 - 10), width: L(20), height: L(20)))
let para = NSMutableParagraphStyle(); para.alignment = .center
let attr: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: L(15), weight: .heavy),
    .foregroundColor: NSColor(red: 0.35, green: 0.22, blue: 0.02, alpha: 1),
    .paragraphStyle: para]
let s = NSAttributedString(string: "$", attributes: attr)
let sz = s.size()
s.draw(at: NSPoint(x: L(50) - sz.width / 2, y: L(100 - 86) - sz.height / 2))

NSGraphicsContext.restoreGraphicsState()
let png = rep.representation(using: .png, properties: [:])!
try! png.write(to: URL(fileURLWithPath: "icon.png"))
print("wrote icon.png (\(png.count) bytes)")
