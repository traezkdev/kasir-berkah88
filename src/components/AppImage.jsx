import React from 'react';

function Image({
  src,
  alt = "Image Name",
  className = "",
  fallbackSrc = "/assets/images/no_image.png",
  ...props
}) {

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.target.src = fallbackSrc;
      }}
      {...props}
    />
  );
}

export default Image;
