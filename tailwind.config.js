/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // 📘 React Native Note — NativeWind dark mode
  // 'media' tells NativeWind to respect the system's dark/light setting via
  // React Native's useColorScheme(). Add dark: prefix to any className to
  // apply that style only when the OS is in dark mode:
  //   className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
  // app.json already sets userInterfaceStyle: 'automatic' which allows the
  // OS to control the theme. No manual toggle needed.
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1A3A5C", light: "#2563EB", pale: "#EFF6FF" },
        success: { DEFAULT: "#16A34A", pale: "#F0FDF4" },
        warn: { DEFAULT: "#D97706", pale: "#FFFBEB" },
        danger: { DEFAULT: "#DC2626", pale: "#FEF2F2" },
        surface: { DEFAULT: "#FFFFFF", alt: "#F8FAFC", border: "#E2E8F0" },
      },
    },
  },
  plugins: [],
};
