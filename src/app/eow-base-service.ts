import {Subscription} from 'rxjs';

export abstract class EowBaseService {
  protected subscriptions: Subscription[] = [];

  public destroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
