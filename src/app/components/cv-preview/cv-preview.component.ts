import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CvDataService } from '../../services/cv-data.service';
import { CvData } from '../../models/cv-data';

@Component({
  selector: 'app-cv-preview',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './cv-preview.component.html',
  styleUrl: './cv-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvPreviewComponent {
  private readonly cvDataService = inject(CvDataService);

  private readonly cvDataSignal = toSignal(this.cvDataService.cvData$, {
    initialValue: this.cvDataService.snapshot,
  });

  readonly cvData = computed<CvData>(() => this.cvDataSignal());

  @ViewChild('previewRef', { static: false }) previewRef?: ElementRef<HTMLElement>;

  readonly trackByIndex = (index: number) => index;

  async exportAsPdf(): Promise<void> {
    if (!this.previewRef) {
      return;
    }

    const element = this.previewRef.nativeElement;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#05091a',
    });

    const imageData = canvas.toDataURL('image/png');
    
    const pageWidth = 210;
    const ratio = pageWidth / canvas.width;
    const pageHeight = canvas.height * ratio;

    const pdf = new jsPDF('p', 'mm', [pageWidth, pageHeight]);

    pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight, '', 'FAST');

    pdf.save('rustam-aslanov-cv.pdf');
  }
}

