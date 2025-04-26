"use client"

import { useEffect, useRef } from "react"

export default function WaitingAnimation() {
  const requestRef = useRef<number>()
  const rotationRef = useRef<number>(0)

  useEffect(() => {
    const animate = () => {
      // Increase rotation by 3 degrees each frame for faster animation
      rotationRef.current = (rotationRef.current + 3) % 360

      // Update the animation
      const circle = document.getElementById("spinner-circle")
      if (circle) {
        circle.style.transform = `rotate(${rotationRef.current}deg)`
      }

      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle className="text-muted stroke-current" strokeWidth="4" fill="transparent" r="42" cx="50" cy="50" />
          <circle
            id="spinner-circle"
            className="text-primary stroke-current"
            strokeWidth="4"
            strokeLinecap="round"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
            strokeDasharray="264, 264"
            strokeDashoffset={184}
            style={{
              transformOrigin: "center",
            }}
          />
        </svg>
        <div className="absolute flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>
      <p className="mt-4 text-muted-foreground font-medium">Listening for webhook events</p>
      <p className="mt-2 text-sm text-muted-foreground">Your endpoint is active and ready to receive events</p>
    </div>
  )
}
