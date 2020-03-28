export enum TorrentStatus {
  'Ready' = 'Ready',
  'Downloading' = 'Downloading',
  'Removed from hoster website' = 'Removed from hoster website',
  'Upload fail' = 'Upload fail',
  'Not downloaded in 20 min' = 'Not downloaded in 20 min',
}

export class TorrentLink {
  link: string;
  filename: string;
  size: number;
  files: string[];
}

export class Torrent {
  id: number;
  filename: string;
  size: number;
  status: TorrentStatus;
  statusCode: number;
  downloaded: number;
  uploaded: number;
  seeders: number;
  downloadSpeed: number;
  uploadDate: number;
  links: TorrentLink[];
}
