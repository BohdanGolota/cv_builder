export interface Experience {
  projectName: string;
  role: string;
  dates: string;
  description: string;
  bullets: string[];
  technologies: string[];
  iconUrls?: string[];
}

export interface CvData {
  fullName: string;
  position: string;
  summary: string;
  photoUrl: string | null;
  languages: string[];
  technologies: string[];
  experiences: Experience[];
}

