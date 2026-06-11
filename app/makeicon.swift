// Renders the 1024x1024 app icon: WiFi arcs rising from a gold dollar coin
// on a dark blue squircle (Big Sur style: 824pt artwork centered on 1024 canvas).
// Usage: swift makeicon.swift /path/to/output.png
import AppKit

let canvas: CGFloat = 1024
let img = NSImage(size: NSSize(width: canvas, height: canvas))
img.lockFocus()

// Squircle background with vertical gradient
let bgRect = NSRect(x: 100, y: 100, width: 824, height: 824)
let squircle = NSBezierPath(roundedRect: bgRect, xRadius: 186, yRadius: 186)
squircle.addClip()
NSGradient(colors: [
    NSColor(calibratedRed: 0.04, green: 0.06, blue: 0.13, alpha: 1),
    NSColor(calibratedRed: 0.10, green: 0.17, blue: 0.33, alpha: 1),
])!.draw(in: bgRect, angle: 90)

// Faint oversized arcs as background texture
let faint = NSColor(calibratedWhite: 1, alpha: 0.05)
faint.setStroke()
for r: CGFloat in [560, 680] {
    let p = NSBezierPath()
    p.appendArc(withCenter: NSPoint(x: 512, y: 300), radius: r, startAngle: 30, endAngle: 150)
    p.lineWidth = 30
    p.lineCapStyle = .round
    p.stroke()
}

// WiFi arcs in green, radiating up from the coin
let green = NSColor(calibratedRed: 0.30, green: 0.87, blue: 0.50, alpha: 1)
let coinCenter = NSPoint(x: 512, y: 330)
green.setStroke()
for (i, r) in ([195, 300, 405] as [CGFloat]).enumerated() {
    let p = NSBezierPath()
    p.appendArc(withCenter: coinCenter, radius: r, startAngle: 42, endAngle: 138)
    p.lineWidth = 58 - CGFloat(i) * 4
    p.lineCapStyle = .round
    p.stroke()
}

// Gold dollar coin as the WiFi source dot
let coinR: CGFloat = 96
let coinRect = NSRect(x: coinCenter.x - coinR, y: coinCenter.y - coinR, width: coinR * 2, height: coinR * 2)
NSGradient(colors: [
    NSColor(calibratedRed: 1.00, green: 0.85, blue: 0.35, alpha: 1),
    NSColor(calibratedRed: 0.93, green: 0.65, blue: 0.13, alpha: 1),
])!.draw(in: NSBezierPath(ovalIn: coinRect), angle: -90)
let rim = NSBezierPath(ovalIn: coinRect.insetBy(dx: 10, dy: 10))
rim.lineWidth = 6
NSColor(calibratedRed: 0.72, green: 0.48, blue: 0.07, alpha: 0.8).setStroke()
rim.stroke()

// Dollar sign centered on the coin
let dollar = NSAttributedString(string: "$", attributes: [
    .font: NSFont.boldSystemFont(ofSize: 130),
    .foregroundColor: NSColor(calibratedRed: 0.35, green: 0.22, blue: 0.02, alpha: 1),
])
let dSize = dollar.size()
dollar.draw(at: NSPoint(x: coinCenter.x - dSize.width / 2, y: coinCenter.y - dSize.height / 2))

img.unlockFocus()

// Write PNG
guard CommandLine.arguments.count > 1 else {
    FileHandle.standardError.write("usage: swift makeicon.swift output.png\n".data(using: .utf8)!)
    exit(1)
}
let tiff = img.tiffRepresentation!
let rep = NSBitmapImageRep(data: tiff)!
let png = rep.representation(using: .png, properties: [:])!
try! png.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
print("icon written: \(CommandLine.arguments[1])")
