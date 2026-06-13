// Renders branded installer artwork in the app's brand palette (deep navy,
// green WiFi arcs, gold coin). Dependency-free: AppKit/CoreGraphics only.
//   - DMG background 640x470  (@1x + @2x -> retina TIFF by the build step)
//   - NSIS sidebar 164x314 and header 150x57  (-> BMP by the build step)
// Usage: swift make-installer-assets.swift /path/to/build-dir
import AppKit

let navyDark  = NSColor(calibratedRed: 0.03, green: 0.05, blue: 0.11, alpha: 1)
let navyMid   = NSColor(calibratedRed: 0.06, green: 0.10, blue: 0.21, alpha: 1)
let navyLight = NSColor(calibratedRed: 0.11, green: 0.19, blue: 0.36, alpha: 1)
let green     = NSColor(calibratedRed: 0.30, green: 0.87, blue: 0.50, alpha: 1)
let greenSoft = NSColor(calibratedRed: 0.55, green: 0.93, blue: 0.68, alpha: 1)
let goldHi    = NSColor(calibratedRed: 1.00, green: 0.85, blue: 0.35, alpha: 1)
let goldLo    = NSColor(calibratedRed: 0.93, green: 0.65, blue: 0.13, alpha: 1)

guard CommandLine.arguments.count > 1 else {
    FileHandle.standardError.write("usage: swift make-installer-assets.swift <outdir>\n".data(using: .utf8)!)
    exit(1)
}
let outDir = CommandLine.arguments[1]

// opaque=true → 24-bit RGB with NO alpha channel. DMG backgrounds MUST be
// opaque: Finder's disk-image background renderer shows nothing for an image
// that carries an alpha channel, even when every pixel is fully opaque.
func savePNG(_ img: NSImage, _ name: String, pixelsWide: Int, pixelsHigh: Int, opaque: Bool = true) {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pixelsWide, pixelsHigh: pixelsHigh,
                               bitsPerSample: 8, samplesPerPixel: opaque ? 3 : 4, hasAlpha: !opaque, isPlanar: false,
                               colorSpaceName: .calibratedRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = img.size
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    img.draw(in: NSRect(origin: .zero, size: img.size))
    NSGraphicsContext.restoreGraphicsState()
    let png = rep.representation(using: .png, properties: [:])!
    try! png.write(to: URL(fileURLWithPath: "\(outDir)/\(name)"))
    print("written: \(outDir)/\(name) (\(opaque ? "opaque" : "alpha"))")
}

func text(_ s: String, _ font: NSFont, _ color: NSColor, kern: CGFloat = 0) -> NSAttributedString {
    NSAttributedString(string: s, attributes: [.font: font, .foregroundColor: color, .kern: kern])
}
func drawCentered(_ t: NSAttributedString, x: CGFloat, y: CGFloat) {
    let sz = t.size(); t.draw(at: NSPoint(x: x - sz.width / 2, y: y))
}
// soft radial glow centered at p
func glow(_ p: NSPoint, radius: CGFloat, color: NSColor, inner: CGFloat = 0.0) {
    let g = NSGradient(colors: [color, color.withAlphaComponent(0)])!
    g.draw(fromCenter: p, radius: radius * inner, toCenter: p, radius: radius, options: [])
}

// Brand mark: gold coin with green WiFi arcs rising from it.
func drawMark(center: NSPoint, coinR: CGFloat) {
    glow(NSPoint(x: center.x, y: center.y + coinR * 1.2), radius: coinR * 6, color: green.withAlphaComponent(0.18))
    green.setStroke()
    for (i, m) in ([2.0, 3.1, 4.2] as [CGFloat]).enumerated() {
        let p = NSBezierPath()
        p.appendArc(withCenter: center, radius: coinR * m, startAngle: 42, endAngle: 138)
        p.lineWidth = coinR * 0.58 - CGFloat(i) * coinR * 0.04
        p.lineCapStyle = .round
        p.stroke()
    }
    let coinRect = NSRect(x: center.x - coinR, y: center.y - coinR, width: coinR * 2, height: coinR * 2)
    let sh = NSShadow(); sh.shadowColor = goldLo.withAlphaComponent(0.6); sh.shadowBlurRadius = coinR * 1.1
    NSGraphicsContext.saveGraphicsState(); sh.set()
    NSGradient(colors: [goldHi, goldLo])!.draw(in: NSBezierPath(ovalIn: coinRect), angle: -90)
    NSGraphicsContext.restoreGraphicsState()
    NSColor(calibratedWhite: 1, alpha: 0.35).setStroke()
    let rim = NSBezierPath(ovalIn: coinRect.insetBy(dx: 0.5, dy: 0.5)); rim.lineWidth = 1; rim.stroke()
    let d = text("$", NSFont.boldSystemFont(ofSize: coinR * 1.35),
                 NSColor(calibratedRed: 0.35, green: 0.22, blue: 0.02, alpha: 1))
    let ds = d.size()
    d.draw(at: NSPoint(x: center.x - ds.width / 2, y: center.y - ds.height / 2))
}

// "WiFi Billionaire" wordmark, white + green, centered as a unit.
func drawWordmark(x: CGFloat, y: CGFloat, size: CGFloat) {
    let a = text("WiFi ", NSFont.boldSystemFont(ofSize: size), .white, kern: -0.3)
    let b = text("Billionaire", NSFont.boldSystemFont(ofSize: size), green, kern: -0.3)
    let total = a.size().width + b.size().width
    a.draw(at: NSPoint(x: x - total / 2, y: y))
    b.draw(at: NSPoint(x: x - total / 2 + a.size().width, y: y))
}

// faint oversized wifi-arc texture rising from a point
func arcTexture(center: NSPoint, radii: [CGFloat], width: CGFloat, alpha: CGFloat) {
    NSColor(calibratedWhite: 1, alpha: alpha).setStroke()
    for r in radii {
        let p = NSBezierPath()
        p.appendArc(withCenter: center, radius: r, startAngle: 22, endAngle: 158)
        p.lineWidth = width; p.lineCapStyle = .round; p.stroke()
    }
}

// rounded-rect pill
func pill(_ rect: NSRect, fill: NSColor, stroke: NSColor, lw: CGFloat = 1) {
    let p = NSBezierPath(roundedRect: rect, xRadius: rect.height / 2, yRadius: rect.height / 2)
    fill.setFill(); p.fill()
    stroke.setStroke(); p.lineWidth = lw; p.stroke()
}

// ---------- DMG background (logical 640x470) ----------
func drawDMG(_ scale: CGFloat) -> NSImage {
    let w: CGFloat = 640, h: CGFloat = 470
    let img = NSImage(size: NSSize(width: w * scale, height: h * scale))
    img.lockFocus()
    let t = NSAffineTransform(); t.scale(by: scale); t.concat()

    // base gradient + ambient glows
    NSGradient(colors: [navyDark, navyMid, navyLight])!.draw(in: NSRect(x: 0, y: 0, width: w, height: h), angle: 90)
    glow(NSPoint(x: w / 2, y: 430), radius: 260, color: navyLight.withAlphaComponent(0.55))
    glow(NSPoint(x: 168, y: 238), radius: 150, color: green.withAlphaComponent(0.06))
    arcTexture(center: NSPoint(x: w / 2, y: -150), radii: [360, 450, 540], width: 16, alpha: 0.035)

    // header: mark + wordmark + eyebrow
    drawMark(center: NSPoint(x: w / 2, y: 418), coinR: 13)
    drawWordmark(x: w / 2, y: 356, size: 30)
    drawCentered(text("CONNECTION GAMES", NSFont.systemFont(ofSize: 10, weight: .semibold),
                      NSColor(calibratedWhite: 0.72, alpha: 1), kern: 3.4), x: w / 2, y: 338)

    // landing pads under the two icon slots (icon centers: 168 & 472, cocoa y=238)
    let padY: CGFloat = 238
    for (cx, tint) in [(CGFloat(168), green), (CGFloat(472), NSColor.white)] {
        glow(NSPoint(x: cx, y: padY), radius: 92, color: tint.withAlphaComponent(0.07))
        let pad = NSBezierPath(ovalIn: NSRect(x: cx - 78, y: padY - 78, width: 156, height: 156))
        NSColor(calibratedWhite: 1, alpha: 0.05).setFill(); pad.fill()
        NSColor(calibratedWhite: 1, alpha: 0.12).setStroke(); pad.lineWidth = 1; pad.stroke()
    }

    // glowing dashed arrow: app -> Applications
    let sh = NSShadow(); sh.shadowColor = green.withAlphaComponent(0.6); sh.shadowBlurRadius = 8
    NSGraphicsContext.saveGraphicsState(); sh.set()
    green.setStroke()
    let line = NSBezierPath()
    line.move(to: NSPoint(x: 262, y: padY)); line.line(to: NSPoint(x: 372, y: padY))
    line.setLineDash([10, 8], count: 2, phase: 0); line.lineWidth = 4; line.lineCapStyle = .round
    line.stroke()
    let head = NSBezierPath()
    head.move(to: NSPoint(x: 372, y: padY + 11))
    head.line(to: NSPoint(x: 390, y: padY))
    head.line(to: NSPoint(x: 372, y: padY - 11))
    head.lineWidth = 4; head.lineCapStyle = .round; head.lineJoinStyle = .round; head.stroke()
    NSGraphicsContext.restoreGraphicsState()
    drawCentered(text("drag to install", NSFont.systemFont(ofSize: 12.5, weight: .semibold),
                      greenSoft, kern: 0.4), x: w / 2, y: padY + 30)

    // first-launch hint pill (unsigned app => one-time right-click → Open)
    let hintStr = text("First launch: right-click the app → Open",
                       NSFont.systemFont(ofSize: 12, weight: .medium),
                       NSColor(calibratedWhite: 0.86, alpha: 1), kern: 0.2)
    let hw = hintStr.size().width
    let pillRect = NSRect(x: w / 2 - hw / 2 - 34, y: 60, width: hw + 56, height: 34)
    pill(pillRect, fill: NSColor(calibratedWhite: 1, alpha: 0.05),
         stroke: goldLo.withAlphaComponent(0.55), lw: 1)
    let star = text("✦", NSFont.systemFont(ofSize: 12, weight: .bold), goldHi)
    star.draw(at: NSPoint(x: pillRect.minX + 14, y: 70))
    hintStr.draw(at: NSPoint(x: pillRect.minX + 34, y: 71))

    drawCentered(text("© 2026 Connection Games · For entertainment only",
                      NSFont.systemFont(ofSize: 9.5, weight: .regular),
                      NSColor(calibratedWhite: 0.42, alpha: 1)), x: w / 2, y: 26)

    img.unlockFocus()
    return img
}
savePNG(drawDMG(1), "dmg-bg.png", pixelsWide: 640, pixelsHigh: 470)
savePNG(drawDMG(2), "dmg-bg@2x.png", pixelsWide: 1280, pixelsHigh: 940)

// ---------- NSIS sidebar 164x314 ----------
func drawSidebar() -> NSImage {
    let w: CGFloat = 164, h: CGFloat = 314
    let img = NSImage(size: NSSize(width: w, height: h))
    img.lockFocus()
    NSGradient(colors: [navyDark, navyMid, navyLight])!.draw(in: NSRect(x: 0, y: 0, width: w, height: h), angle: 90)
    glow(NSPoint(x: w / 2, y: 250), radius: 130, color: navyLight.withAlphaComponent(0.6))
    arcTexture(center: NSPoint(x: w / 2, y: -50), radii: [150, 195, 240], width: 9, alpha: 0.05)

    drawMark(center: NSPoint(x: w / 2, y: 232), coinR: 14)
    drawCentered(text("WiFi", NSFont.boldSystemFont(ofSize: 25), .white, kern: -0.3), x: w / 2, y: 150)
    drawCentered(text("Billionaire", NSFont.boldSystemFont(ofSize: 25), green, kern: -0.3), x: w / 2, y: 121)
    drawCentered(text("CONNECTION GAMES", NSFont.systemFont(ofSize: 7.5, weight: .semibold),
                      NSColor(calibratedWhite: 0.70, alpha: 1), kern: 2.0), x: w / 2, y: 103)

    let rule = NSBezierPath()
    rule.move(to: NSPoint(x: w / 2 - 26, y: 92)); rule.line(to: NSPoint(x: w / 2 + 26, y: 92))
    rule.lineWidth = 2; rule.lineCapStyle = .round; goldLo.setStroke(); rule.stroke()

    drawCentered(text("From a mattress to a market cap", NSFont.systemFont(ofSize: 7.5, weight: .regular),
                      NSColor(calibratedWhite: 0.55, alpha: 1)), x: w / 2, y: 70)
    drawCentered(text("© 2026 Connection Games", NSFont.systemFont(ofSize: 7, weight: .regular),
                      NSColor(calibratedWhite: 0.42, alpha: 1)), x: w / 2, y: 14)
    img.unlockFocus()
    return img
}
savePNG(drawSidebar(), "installerSidebar.png", pixelsWide: 164, pixelsHigh: 314)

// ---------- NSIS header 150x57 ----------
func drawHeader() -> NSImage {
    let w: CGFloat = 150, h: CGFloat = 57
    let img = NSImage(size: NSSize(width: w, height: h))
    img.lockFocus()
    NSGradient(colors: [navyMid, navyLight])!.draw(in: NSRect(x: 0, y: 0, width: w, height: h), angle: 0)
    drawMark(center: NSPoint(x: 28, y: 24), coinR: 8)
    text("WiFi ", NSFont.boldSystemFont(ofSize: 13), .white, kern: -0.2).draw(at: NSPoint(x: 50, y: 21))
    text("Billionaire", NSFont.boldSystemFont(ofSize: 13), green, kern: -0.2)
        .draw(at: NSPoint(x: 50 + text("WiFi ", NSFont.boldSystemFont(ofSize: 13), .white).size().width, y: 21))
    img.unlockFocus()
    return img
}
savePNG(drawHeader(), "installerHeader.png", pixelsWide: 150, pixelsHigh: 57)
