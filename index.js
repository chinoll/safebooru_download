const axios = require("axios-extra")
axios.defaults.maxConcurrent = 1000
axios.defaults.queueOptions.retry = 3
const cheerio = require("cheerio")
const fs = require("fs")
const uuid = require("node-uuid")
const async = require("async")
const util = require("util")
async function download_image(tags,page_count) {
    let base_url = util.format("https://safebooru.donmai.us/posts?page=%d&tags=%s",page_count,tags)
    await axios({
        method:"get",
        url:base_url
    }).then(async (respone) => {
        $ = cheerio.load(respone.data)
        let html = $("#posts-container").html()
        let reg = /https:\/\/cdn.donmai.us\/original\/.{2}\/.{2}\/[a-zA-Z0-9]*\.jpg/g
        let link_arr = html.match(reg)
        async.mapLimit(link_arr,link_arr.length,async (url) => {
            console.log("download",url)
            let image_name = url.split("/")
            image_name = image_name[image_name.length - 1]
            await axios({
                method:'get',
                url:url,
                responseType:'arraybuffer'
            }).then((response) => {
                fs.writeFile(image_name,response.data,'binary',() => {})
            })
        },() => {
            console.log(page_count,"OK")
        })
    })
}
async function download(keyword,concurrent) {
    for(let i = 1;i <= 1000;i += concurrent) {
        let page_count = []
        for(let j = 0;j < concurrent;j++)
            page_count.push(i + j)

        async.mapLimit(page_count,concurrent,async (page_count) => {
            await download_image(keyword,page_count)
        },() => {})
    }
}
download("standing+",5)