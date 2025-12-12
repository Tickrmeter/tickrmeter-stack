// import { useState, useEffect, useRef } from "react";

// const useDebounce = (value, delay = 300) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);
//   const timeoutRef = useRef(null);

//   useEffect(() => {
//     // Clear existing timeout
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }

//     // Set new timeout
//     timeoutRef.current = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     // Cleanup function
//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current);
//       }
//     };
//   }, [value, delay]);

//   return debouncedValue;
// };

// export default useDebounce;

// useDebounce.js
import { useCallback, useRef } from "react";

const useDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  const debouncedFn = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedFn;
};

export default useDebounce;
