const db = require('../../../db')
const getPhotos = async () => {
  const sql = `select * from photos ;`
  return new Promise((resolve, reject) => {
    db.query(sql, async (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

const matchPhotos = async (ramblings) => {
  const photos = await getPhotos()
  return ramblings.map(r => {
    const photos_r = photos.filter(p => p.rambling_id === r.id)
    return {
      ...r,
      photos: photos_r
    }
  })
}


module.exports = {
  getPhotos,
  matchPhotos
}