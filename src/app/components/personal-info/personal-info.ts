import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CvService} from '../services/cv.service';
import {MatFormField} from '@angular/material/form-field.d';
import {MatLabel} from '@angular/material/form-field-module.d';

@Component({
  selector: 'app-personal-info',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel
  ],
  templateUrl: './personal-info.html',
  styleUrl: './personal-info.scss',
})
export class PersonalInfo implements OnInit {
  personalForm: FormGroup;

  constructor(private fb: FormBuilder, private cvService: CvService) {}

  ngOnInit() {
    this.personalForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern(/^\d{10,}$/)],
      summary: ['', Validators.maxLength(200)]
    });
  }

  onSubmit() {
    if (this.personalForm.valid) {
      this.cvService.updateSection('personal', this.personalForm.value);
    }
  }
}
