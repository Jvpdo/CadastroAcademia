// app/(private)/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

// Este layout simplesmente define que as rotas dentro de (private)
// usarão uma navegação do tipo Stack. A proteção já foi feita pelo layout raiz.
export default function PrivateStackLayout() {
    return <Stack screenOptions={{ headerShown: false }} />;
}
