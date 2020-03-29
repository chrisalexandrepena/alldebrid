export class FailedMagnetUpload {
  magnet: string;
  error: {
    code: string;
    message: string;
  };
}
