export type CardItemT = {
  description?: string;
  hasActions?: boolean;
  hasVariant?: boolean;
  image: any;
  isOnline?: boolean;
  matches?: string;
  name: string;
};

export type IconT = {
  name: any;
  size: number;
  color: string;
  style?: any;
};

export type MessageT = {
  image: any;
  lastMessage: string;
  name: string;
};

export type ProfileItemT = {
  age?: string;
  info1?: string;
  info2?: string;
  info3?: string;
  info4?: string;
  info5?: Array<string>;
  aboutMe?: string;
  matches: string;
  name: string;
};

export type TabBarIconT = {
  focused: boolean;
  iconName: any;
  text: string;
  typ: string;
};

export type ProfileT = {
  onContentHeightChange?: (height: number) => void;
  id: string;
  username: string;
  relatedInfo?: {
    title: string;
    description: string;
    photos: Array<{
      filePath: string; id: number 
    }>; 
    videos: Array<{
      filePath: string; id: number 
    }>; 
  } | null;
  parentCategory?: Array<{
    id: number;
    title: string;
    description: string;
    parentCattegforyId: string;
    relatedInfo?: Array<{
      id: string;
      title: string; 
      description: string;
      photos?: Array<{
        filePath: string; id: number 
      }>; 
      videos?: Array<{
        filePath: string; id: number 
      }>; 
    }>;
    childCategory?: Array<{
      id: number;
      title: string;
      description: string;
      relatedInfo?: Array<{
        id: string;
        title: string; 
        description: string;
        photos?: Array<{
          filePath: string; id: number 
        }>; 
        videos?: Array<{
          filePath: string; id: number 
        }>; 
      }>;
      childChildCategory?: Array<{
        id: number;
        title: string;
        description: string;
        parentCattegforyId: string;
        relatedInfo?: Array<{
          id: string;
          title: string; 
          description: string;
          photos?: Array<{
            filePath: string; id: number 
          }>; 
          videos?: Array<{
            filePath: string; id: number 
          }>; 
        }> | null;
      }> | null;
    }> | null;
  }> | null; 
};
