import { TorrentLink } from './TorrentLink';

export enum TorrentStatus {
  'ready' = 'Ready',
  'downloading' = 'Downloading',
  'removed' = 'Removed from hoster website',
  'upload_failed' = 'Upload fail',
  'download_failed' = 'Not downloaded in 20 min',
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
