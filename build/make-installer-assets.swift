// Renders branded installer artwork (brand palette = app icon: dark navy,
// green WiFi arcs, gold coin):
//   - DMG background 600x420 (@1x + @2x -> combined retina TIFF by build step)
//   - Windows NSIS sidebar 164x314 and header 150x57 (converted to BMP by build step)
// Usage: swift make-installer-assets.swift /path/to/build-dir
import AppKit

let navyDark  = NSColor(calibratedRed: 0.04, green: 0.06, blue: 0.13, alpha: 1)
let navyLight = NSColor(calibratedRed: 0.10, green: 0.17, blue: 0.33, alpha: 1)
let green     = NSColor(calibratedRed: 0.30, green: 0.87, blue: 0.50, alpha: 1)
let goldHi    = NSColor(calibratedRed: 1.00, green: 0.85, blue: 0.35, alpha: 1)
let goldLo    = NSColor(calibratedRed: 0.93, green: 0.65, blue: 0.13, alpha: 1)

guard CommandLine.arguments.count > 1 else {
    FileHandle.standardError.write("usage: swift make-installer-assets.swift <outdir>\n".data(using: .utf8)!)
    exit(1)
}
let outDir = CommandLine.arguments[1]

func savePNG(_ img: NSImage, _ name: String, pixelsWide: Int, pixelsHigh: Int) {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pixelsWide, pixelsHigh: pixelsHigh,
                               bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                               colorSpaceName: .calibratedRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = img.size
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    img.draw(in: NSRect(origin: .zero, size: img.size))
    NSGraphicsContext.restoreGraphicsState()
    let png = rep.representation(using: .png, properties: [:])!
    try! png.write(to: URL(fileURLWithPath: "\(outDir)/\(name)"))
    print("written: \(outDir)/\(name)")
}

func text(_ s: String, _ font: NSFont, _ color: NSColor, kern: CGFloat = 0) -> NSAttributedString {
    NSAttributedString(string: s, attributes: [.font: font, .foregroundColor: color, .kern: kern])
}
func drawCentered(_ t: NSAttributedString, x: CGFloat, y: CGFloat) {
    let sz = t.size()
    t.draw(at: NSPoint(x: x - sz.width / 2, y: y))
}

// Small brand mark: gold coin + green wifi arcs rising from it. center = coin center.
func drawMark(center: NSPoint, coinR: CGFloat) {
    green.setStroke()
    for (i, m) in ([2.0, 3.1, 4.2] as [CGFloat]).enumerated() {
        let p = NSBezierPath()
        p.appendArc(withCenter: center, radius: coinR * m, startAngle: 42, endAngle: 138)
        p.lineWidth = coinR * 0.58 - CGFloat(i) * coinR * 0.04
        p.lineCapStyle = .round
        p.stroke()
    }
    let coinRect = NSRect(x: center.x - coinR, y: center.y - coinR, width: coinR * 2, height: coinR * 2)
    NSGradient(colors: [goldHi, goldLo])!.draw(in: NSBezierPath(ovalIn: coinRect), angle: -90)
    let d = text("$", NSFont.boldSystemFont(ofSize: coinR * 1.35),
                 NSColor(calibratedRed: 0.35, green: 0.22, blue: 0.02, alpha: 1))
    let ds = d.size()
    d.draw(at: NSPoint(x: center.x - ds.width / 2, y: center.y - ds.height / 2))
}

// ---------- DMG background (logical 600x420) ----------
func drawDMG(_ scale: CGFloat) -> NSImage {
    let w: CGFloat = 600, h: CGFloat = 420
    let img = NSImage(size: NSSize(width: w * scale, height: h * scale))
    img.lockFocus()
    let t = NSAffineTransform(); t.scale(by: scale); t.concat()

    NSGradient(colors: [navyDark, navyLight])!.draw(in: NSRect(x: 0, y: 0, width: w, height: h), angle: 90)

    // faint oversized arc texture, echoing the icon
    NSColor(calibratedWhite: 1, alpha: 0.04).setStroke()
    for r: CGFloat in [330, 410, 490] {
        let p = NSBezierPath()
        p.appendArc(withCenter: NSPoint(x: w / 2, y: -120), radius: r, startAngle: 25, endAngle: 155)
        p.lineWidth = 16
        p.lineCapStyle = .round
        p.stroke()
    }

    // header: brand mark + wordmark
    drawMark(center: NSPoint(x: w / 2, y: 352), coinR: 11)
    drawCentered(text("WiFi Billionaire", NSFont.boldSystemFont(ofSize: 27), .white, kern: -0.3), x: w / 2, y: 295)
    drawCentered(text("CONNECTION GAMES", NSFont.systemFont(ofSize: 10, weight: .semibold),
                      NSColor(calibratedWhite: 0.72, alpha: 1), kern: 3.2), x: w / 2, y: 278)

    // soft landing pads under the two icon slots (icons centered at top-origin y=195 -> cocoa y=225)
    for cx: CGFloat in [150, 450] {
        let pad = NSBezierPath(ovalIn: NSRect(x: cx - 70, y: 225 - 70, width: 140, height: 140))
        NSColor(calibratedWhite: 1, alpha: 0.045).setFill()
        pad.fill()
        NSColor(calibratedWhite: 1, alpha: 0.10).setStroke()
        pad.lineWidth = 1
        pad.stroke()
    }

    // dashed green guide line with arrowhead, app -> Applications
    let yLine: CGFloat = 225
    let line = NSBezierPath()
    line.move(to: NSPoint(x: 232, y: yLine))
    line.line(to: NSPoint(x: 358, y: yLine))
    line.setLineDash([9, 7], count: 2, phase: 0)
    line.lineWidth = 3.5
    line.lineCapStyle = .round
    green.setStroke()
    line.stroke()
    let head = NSBezierPath()
    head.move(to: NSPoint(x: 356, y: yLine + 9))
    head.line(to: NSPoint(x: 370, y: yLine))
    head.line(to: NSPoint(x: 356, y: yLine - 9))
    head.lineWidth = 3.5
    head.lineCapStyle = .round
    head.lineJoinStyle = .round
    head.stroke()

    drawCentered(text("drag here to install", NSFont.systemFont(ofSize: 12, weight: .medium),
                      NSColor(calibratedRed: 0.55, green: 0.93, blue: 0.68, alpha: 1), kern: 0.4),
                 x: w / 2, y: 236)

    drawCentered(text("© 2026 Connection Games", NSFont.systemFont(ofSize: 9.5, weight: .regular),
                      NSColor(calibratedWhite: 0.45, alpha: 1)), x: w / 2, y: 24)

    img.unlockFocus()
    return img
}
savePNG(drawDMG(1), "dmg-bg.png", pixelsWide: 600, pixelsHigh: 420)
savePNG(drawDMG(2), "dmg-bg@2x.png", pixelsWide: 1200, pixelsHigh: 840)

// ---------- NSIS sidebar 164x314 ----------
func drawSidebar() -> NSImage {
    let w: CGFloat = 164, h: CGFloat = 314
    let img = NSImage(size: NSSize(width: w, height: h))
    img.lockFocus()
    NSGradient(colors: [navyDark, navyLight])!.draw(in: NSRect(x: 0, y: 0, width: w, height: h), angle: 90)

    NSColor(calibratedWhite: 1, alpha: 0.05).setStroke()
    for r: CGFloat in [150, 195, 240] {
        let p = NSBezierPath()
        p.appendArc(withCenter: NSPoint(x: w / 2, y: -40), radius: r, startAngle: 20, endAngle: 160)
        p.lineWidth = 9
        p.lineCapStyle = .round
        p.stroke()
    }

    drawMark(center: NSPoint(x: w / 2, y: 208), coinR: 13)
    drawCentered(text("WiFi", NSFont.boldSystemFont(ofSize: 24), .white, kern: -0.3), x: w / 2, y: 130)
    drawCentered(text("Billionaire", NSFont.boldSystemFont(ofSize: 24),
                      NSColor(calibratedRed: 0.30, green: 0.87, blue: 0.50, alpha: 1), kern: -0.3), x: w / 2, y: 102)
    drawCentered(text("CONNECTION GAMES", NSFont.systemFont(ofSize: 7.5, weight: .semibold),
                      NSColor(calibratedWhite: 0.70, alpha: 1), kern: 2.0), x: w / 2, y: 84)

    // gold accent rule
    let rule = NSBezierPath()
    rule.move(to: NSPoint(x: w / 2 - 26, y: 74))
    rule.line(to: NSPoint(x: w / 2 + 26, y: 74))
    rule.lineWidth = 2
    rule.lineCapStyle = .round
    goldLo.setStroke()
    rule.stroke()

    drawCentered(text("© 2026 Connection Games", NSFont.systemFont(ofSize: 7, weight: .regular),
                      NSColor(calibratedWhite: 0.45, alpha: 1)), x: w / 2, y: 14)
    img.unlockFocus()
    return img
}
savePNG(drawSidebar(), "installerSidebar.png", pixelsWide: 164, pixelsHigh: 314)

// ---------- NSIS header 150x57 ----------
func drawHeader() -> NSImage {
    let w: CGFloat = 150, h: CGFloat = 57
    let img = NSImage(size: NSSize(width: w, height: h))
    img.lockFocus()
    NSGradient(colors: [navyDark, navyLight])!.draw(in: NSRect(x: 0, y: 0, width: w, height: h), angle: 90)
    drawMark(center: NSPoint(x: 30, y: 22), coinR: 7)
    text("WiFi Billionaire", NSFont.boldSystemFont(ofSize: 13), .white, kern: -0.2)
        .draw(at: NSPoint(x: 52, y: 21))
    img.unlockFocus()
    return img
}
savePNG(drawHeader(), "installerHeader.png", pixelsWide: 150, pixelsHigh: 57)
