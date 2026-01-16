declare module 'react-native-maps' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  export type Provider = 'google' | 'amap' | null | undefined;
  
  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface MapViewProps {
    provider?: Provider;
    style?: ViewStyle;
    initialRegion?: Region;
    mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'none' | 'mutedStandard';
    showsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    showsCompass?: boolean;
    showsScale?: boolean;
    children?: React.ReactNode;
  }

  export interface MarkerProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    children?: React.ReactNode;
  }

  export interface CircleProps {
    center: LatLng;
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  }

  export default class MapView extends Component<MapViewProps> {
    animateToRegion(region: Region, duration?: number): void;
  }

  export class Marker extends Component<MarkerProps> {}
  export class Circle extends Component<CircleProps> {}

  export const PROVIDER_GOOGLE: 'google';
}