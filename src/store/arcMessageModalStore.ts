import { create } from 'zustand';

export type ArcAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

type ArcMessageModalState = {
  visible: boolean;
  title: string;
  message: string;
  buttons: ArcAlertButton[];
  show: (title: string, message: string, buttons?: ArcAlertButton[]) => void;
  hide: () => void;
};

export const useArcMessageModalStore = create<ArcMessageModalState>((set) => ({
  visible: false,
  title: '',
  message: '',
  buttons: [],
  show: (title, message, buttons) => {
    const list =
      buttons && buttons.length > 0
        ? buttons
        : [{ text: '확인', style: 'default' as const }];
    set({ visible: true, title, message, buttons: list });
  },
  hide: () => set({ visible: false, title: '', message: '', buttons: [] }),
}));
