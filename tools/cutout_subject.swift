// Subject cut-out using Apple's Vision framework (on-device).
// usage: swift tools/cutout_subject.swift input.jpg output.png
import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count == 3 else { print("usage: cutout_subject in out.png"); exit(1) }
let url = URL(fileURLWithPath: args[1])
guard let ci = CIImage(contentsOf: url, options: [.applyOrientationProperty: true]) else { print("cannot read"); exit(1) }

let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ci, options: [:])
try handler.perform([req])
guard let obs = req.results?.first else { print("no subject found"); exit(2) }
print("instances:", obs.allInstances.count)
let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: args[2]), format: .RGBA8, colorSpace: cs)
print("saved", args[2])
