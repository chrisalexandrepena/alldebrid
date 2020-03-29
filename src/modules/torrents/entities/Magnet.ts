export type Magnet = {
  magnet: string;
  hash: string;
  name: string;
  size: number;
  id: number;
  ready: boolean;
};

export type FailedMagnetUpload = {
  magnet: string;
  error: {
    code: string;
    message: string;
  };
};
