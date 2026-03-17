import { Platform, View } from 'react-native';

// 📘 React Native Note — Web layout container
// When an Expo app runs in a browser it fills the full viewport width.
// On a wide desktop screen a 400px-wide app stretching to 1920px looks
// wrong — like a mobile UI blown up to fill a billboard.
//
// WebContainer caps the content at 480px and centres it horizontally,
// mimicking a phone screen in the browser. On iOS and Android it renders
// nothing extra (the Platform.OS guard is compile-time tree-shaken by Metro).
//
// We apply a light slate background to the outer container so the "phone
// chrome" sides don't look like blank white space on wide monitors.

interface Props {
  children: React.ReactNode;
}

export function WebContainer({ children }: Props) {
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: '#CBD5E1', alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 480 }}>
        {children}
      </View>
    </View>
  );
}
