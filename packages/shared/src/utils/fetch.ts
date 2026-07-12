import axios from 'axios'

const REQUEST_TIMEOUT_MS = 30 * 1000
const UPLOAD_METHOD_RE = /^(?:post|put|delete)$/i

// 创建axios实例
const service = axios.create({
  baseURL: ``,
  timeout: REQUEST_TIMEOUT_MS, // 请求超时时间
})

service.interceptors.request.use(
  (config) => {
    if (UPLOAD_METHOD_RE.test(`${config.method}`)) {
      if (config.data && config.data.upload) {
        config.headers[`Content-Type`] = `multipart/form-data`
      }
    }
    return config
  },
  (error) => {
    Promise.reject(error)
  },
)

service.interceptors.response.use(
  (res) => {
    return res.data ? res.data : Promise.reject(res)
  },
  error => Promise.reject(error),
)

export default service
