const axios = require("axios-extra")
axios.defaults.maxConcurrent = 100  //请求并发数
axios.defaults.queueOptions.retry = 3
const cheerio = require("cheerio")
const fs = require("fs")
const async = require("async")
const util = require("util")
async function download_image(tags,page_count,save_path) {
    let base_url = util.format("https://safebooru.org/index.php?page=post&s=list&tags=%s&pid=%d",tags,page_count*40)
    // console.log(base_url)
    await axios({
        method:"get",
        url:base_url,
        timeout:5000
    }).then((respone) => {
        $ = cheerio.load(respone.data)
        let html = $("#post-list > div.content").html()
        let reg = /https:\/\/safebooru.org\/thumbnails\/[0-9]*\/thumbnail_[a-z0-9A-Z]*\.jpg\?[a-z0-9A-Z]*/g
        let link_arr = html.match(reg)
        async.mapLimit(link_arr,link_arr.length,async (url) => {
            url = url.replace("thumbnails","samples").replace("thumbnail","sample")
            let image_name = url.split("/")
            image_name = image_name[image_name.length - 1].slice(0,-8)

            await axios({
                method:'get',
                url:url,
                responseType:'arraybuffer',
                timeout:5000
            }).then((response) => {
                console.log("download",image_name)
                fs.writeFile(save_path + image_name,response.data,'binary',() => {})
            })
        },() => {
            console.log(page_count,"OK")
        })
    }).catch(async (error) => {
        console.log(error)
    })
}
/*
 *@keyword:下载的tag
 *@concurrent:并发数量
 *@i:从第几页开始下载
 *@page:下载到第几页
*/
async function download(keyword,concurrent,i,page,save_path) {
    i--
    for(;i <= page;i += concurrent) {
        let page_count = []
        for(let j = 0;j < concurrent;j++) {
            if (i + j > page)
                break
            page_count.push(download_image(keyword,i + j,save_path))
        }
        await Promise.all(page_count).then((value) => {}).catch((reason) => {console.log("abort")})
    }
}

//下载多个tag
async function download_tag_list(keyword_list,concurrent) {
    for(let i = 0;i < keyword_list.length;i++) {
        await download(keyword_list[i],concurrent,page[i])
    }
}
let x = []
process.argv.forEach((val, index) => {
    x.push(val)
  })
x = x.slice(2)

download(x[0],parseInt(x[1]),parseInt(x[2]),parseInt(x[3]),x[4])
