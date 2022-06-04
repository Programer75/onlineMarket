// $("#btn-post").click(() =>{     
//     $.ajax({
//         type: "post",
//         url: "/buy",
//         data: {
//             /*
//             id:1,
//             search:"ddd"
//             */
//         },
//         dataType: "json",
//         success: (response)=> {
//             alert(response);
//         }
//     });
// });
// $.post({
//     url: "https://api.vk.com/method/users.get",
//     data: {
//         user_id: parseInt(id),
//         fields: "photo_100",
//         v: 5.81,
//         access_token: "63dc7edf63dc7edf63dc7edf9e63a582d1663dc63dc7edf025a517b99d3de3e0fd1b712"
//     }, // получаем ссылку https://api.vk.com/method/users.get?callback=jQuery22005687240610129102_1638254172673&user_id=417035923&fields=photo_100&v=5.81&access_token=63dc7edf63dc7edf63dc7edf9e63a582d1663dc63dc7edf025a517b99d3de3e0fd1b712&_=1638254172674
//     dataType: "jsonp",
//     success: function (r) {
//         if (r && r.response && r.response[0].photo_100) {
//             return callback(r.response[0].photo_100);
//         } else {
//             // console.log(r.response);
//             console.log("No photo in response");
//         }
//     }
// });
// function gotPhoto(url) {
//     $('#log').attr('src', url);
// }