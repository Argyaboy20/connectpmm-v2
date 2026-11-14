export type Pengguna = {
  nama: string;
  username: string | null;
  role: string;
  roleDiminta: string | null;
  roleDitolak?: string | null;
  alasanPenolakan?: string | null;
};