/**
 * react-native-encrypted-storage는 네이티브 모듈이라 jest 환경에서 링크되지 않는다.
 * AsyncStorage가 공식 제공하는 것과 같은 성격의 인메모리 목 — jest.config.js에서 매핑한다.
 */
const store = new Map();

module.exports = {
  __esModule: true,
  default: {
    getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
    setItem: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async key => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  },
};
