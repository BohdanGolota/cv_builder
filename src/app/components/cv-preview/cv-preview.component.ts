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
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = pageWidth / canvas.width;
    const imgHeight = canvas.height * ratio;

    let position = 0;
    let heightLeft = imgHeight;

    pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imgHeight, '', 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save('rustam-aslanov-cv.pdf');
  }
}

