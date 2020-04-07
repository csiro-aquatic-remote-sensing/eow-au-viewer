import Feature from 'ol/Feature';

export interface SideBarMessage {
  action: string;
  message: string;
  data?: {[name: string]: any};
}

export type WaterBodyFeatures = { [name: string]: Feature[] }; // tslint:disable-line
