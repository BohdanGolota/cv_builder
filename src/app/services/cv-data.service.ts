import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CvData } from '../models/cv-data';

const INITIAL_DATA: CvData = {
  fullName: 'Rustam Aslanov',
  position: 'Front-End Developer',
  summary: 'FullStack React&Node.Js developer with almost 6 years of experience.',
  photoUrl: null,
  languages: ['Ukrainian - Native', 'English - Upper-Intermediate'],
  technologies: [
    'JavaScript',
    'TypeScript',
    'HTML',
    'CSS',
    'ReactJs',
    'Redux',
    'MaterialUI',
    'Next.js',
    'Webpack',
    'SASS',
    'Less',
    'Bootstrap',
    'React Native',
    'Node.js',
    'Express.js',
    'NestJS',
    'MongoDB',
    'MySQL',
    'PostgreSQL',
    'Firebase',
    'REST APIs',
    'Websockets',
    'AWS',
    'GraphQL',
    'Git',
    'GitHub',
    'GitLab',
    'Bitbucket',
    'Jira',
    'Docker',
    'Confluence',
    'Azure',
  ],
  experiences: [
    {
      projectName: 'FRAMEUP',
      role: 'Full Stack Developer',
      dates: 'March 2024 – June 2025',
      description:
        'Social media platform that accumulates all those who are involved in video content creation: motion designers, creatives, 3d modelers, VFX specialists and many others. The main goal is to share video content and view other users’ content. Create own resume, find a job, studio, team or interesting projects.',
      bullets: [
        'Platform Architecture and Backend Development: Design and implement a scalable backend infrastructure to support user profiles;',
        'Video Upload and Streaming Optimization;',
        'User Authentication and Profile Management;',
        'Reduced time-to-market by 30% through efficient project setup and streamlined development workflows;',
        'Search and Matching Algorithms: Implement advanced search functionalities to help users find jobs, studios, teams, or collaborators. Develop algorithms that match users based on skills, job requirements, or project needs, improving the platform’s networking capabilities.',
      ],
      technologies: ['React', 'Node.js', 'AWS', 'MongoDB', 'TypeScript', 'S3', 'FFmpeg'],
      iconUrls: [
        'assets/icons/react.svg',
        'assets/icons/aws.svg',
        'assets/icons/nodejs.svg',
        'assets/icons/typescript.svg',
      ],
    },
    {
      projectName: 'WORKNEST',
      role: 'Full Stack Developer',
      dates: 'August 2023 – March 2024',
      description:
        'A platform for storing the works of designers and developers, with authorization, editing, filtering, searching etc. Includes an admin panel for content and user management. The main goal is to have a beautiful project preview and opportunity to share a selection of works at once.',
      bullets: [
        'Implement secure authorization systems to allow users to register, log in, and manage their portfolios;',
        'Portfolio Management and Editing Features: Develop functionalities for users to upload, edit, and organize their projects;',
        'Advanced Search and Filtering Systems: Design and build search and filtering features that allow users and visitors to easily find projects based on categories, tags, skills, or project types;',
        'Improved system performance by implementing scalable architecture from the start, ensuring the app handled high user load without degradation;',
        'Admin Panel Development.',
      ],
      technologies: ['Angular', 'NestJS', 'PostgreSQL', 'Redis', 'Azure', 'Docker'],
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class CvDataService {
  private readonly cvDataSubject = new BehaviorSubject<CvData>(INITIAL_DATA);
  readonly cvData$ = this.cvDataSubject.asObservable();

  get snapshot(): CvData {
    return this.cvDataSubject.value;
  }

  update(partial: Partial<CvData>): void {
    this.cvDataSubject.next({ ...this.snapshot, ...partial });
  }

  set(data: CvData): void {
    const cloned =
      typeof structuredClone === 'function'
        ? structuredClone(data)
        : JSON.parse(JSON.stringify(data)) as CvData;
    this.cvDataSubject.next(cloned);
  }
}

