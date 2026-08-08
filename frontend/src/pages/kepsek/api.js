import axiosClient from '../../api/axiosClient';

export async function fetchKonselingAll() {
  const { data } = await axiosClient.get('/api/konseling-all');
  return data;
}
