import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CvService {
  private cvData = new BehaviorSubject<any>({});
  currentCv$ = this.cvData.asObservable();

  updateSection(section: string, data: any) {
    const current = this.cvData.value;
    this.cvData.next({ ...current, [section]: data });
  }

  getCvData() {
    return this.cvData.value;
  }
}
