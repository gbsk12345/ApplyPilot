import React from 'react'

const logos = [
  { src: '/logos/netflix.svg',   className: 'top-1/3 left-1/15    w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28' },
  { src: '/logos/microsoft.svg', className: 'top-1/2 left-1/15  w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28' },
  { src: '/logos/meta.svg',      className: 'bottom-1/5 left-1/15 w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28' },
  {src: '/logos/google.svg',  className: 'top-1/5 left-1/13 w-10 h-10 md:w-14 md:h-14 lg:w-18 lg:h-18'},
    
  { src: '/logos/paypal.svg',    className: 'top-1/5 right-1/15 w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28' },
  { src: '/logos/spotify.svg',   className: 'top-1/3 right-1/15   w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28' },
  { src: '/logos/amazon.svg',    className: 'bottom-1/5 right-1/15 w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28' },
  { src: '/logos/oracle.svg',    className: 'top-1/2 right-1/15   w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28' },

]

export default function FancyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {logos.map((logo, idx) => (
        <img
          key={idx}
          src={logo.src}
          alt=""
          className={`
            absolute ${logo.className}
            opacity-80 drop-shadow-2xl
            transition-transform duration-700 hover:scale-105
          `}
        />
      ))}
    </div>
  )
}
