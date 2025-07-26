"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import Image from "next/image"

interface ProjectImageProps {
  prodUrl?: string
  title: string
  imageUrl: string
}

export default function ProjectImage({ prodUrl, title, imageUrl }: ProjectImageProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (prodUrl) {
      window.open(prodUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div
      className="relative h-48 w-full project-image flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={prodUrl ? handleClick : undefined}
      style={{ cursor: prodUrl ? "pointer" : "default" }}
    >
      <Image src={imageUrl} alt={title} fill className="object-cover" />

      {/* Website availability message */}
      {!prodUrl && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-center py-2 text-sm">
          No Website Available
        </div>
      )}

      {/* Visit website overlay */}
      {prodUrl && isHovered && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full flex items-center text-white">
            <ExternalLink size={16} className="mr-2" />
            Visit Website
          </div>
        </div>
      )}
    </div>
  )
}
