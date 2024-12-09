import axios from 'axios';
import { WordPressPost } from '../../types/wordpress';

const WORDPRESS_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/marcellvarga.wordpress.com';

export const getPosts = async (): Promise<WordPressPost[]> => {
  try {
    const response = await axios.get(`${WORDPRESS_URL}/posts`, {
      headers: {
        'Accept': 'application/json',
      },
      params: {
        number: 100, // number of posts to retrieve
        status: 'publish',
      }
    });

    console.log('API Response:', response.data);
    
    if (response.data && response.data.posts) {
      return response.data.posts;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};