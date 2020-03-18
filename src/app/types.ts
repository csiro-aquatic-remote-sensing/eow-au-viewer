export interface SideBarMessage {
  action: string;
  message: string;
  data?: {[name: string]: any};
}
