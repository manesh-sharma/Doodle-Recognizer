import React from "react";

export default function PixelBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Animated Gradient */}
      <div className="absolute inset-0 bg-[length:300%_300%] animate-gradient bg-gradient-to-br from-[#FFF8E8] via-[#FFD6A5] to-[#FFC6C7]" />

      {/* Pixel Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
          linear-gradient(#00000010 1px, transparent 1px),
          linear-gradient(90deg,#00000010 1px,transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating Pixels */}

      <div className="absolute top-24 left-20 w-8 h-8 bg-yellow-300 animate-floatPixel" />
      <div className="absolute top-52 right-40 w-6 h-6 bg-pink-300 animate-floatSlow" />
      <div className="absolute bottom-40 left-1/3 w-10 h-10 bg-orange-300 animate-float2" />
      <div className="absolute bottom-24 right-1/4 w-7 h-7 bg-red-300 animate-floatPixel" />
      <div className="absolute top-1/2 left-2/3 w-5 h-5 bg-green-300 animate-floatSlow" />

      {/* Soft Blur Blobs */}

      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-pink-200 blur-[120px] opacity-40" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-200 blur-[150px] opacity-40" />
    </div>
  );
}
