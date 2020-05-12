var albumBucketName = 'testbucketkhonan';
var dataGlobal;
var albumPhotosKey;
var href;
var bucketUrl;
var pagination;

// **DO THIS**:
//   Replace this block of code with the sample code located at:
//   Cognito -- Manage Identity Pools -- [identity_pool_name] -- Sample Code -- JavaScript
//
// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'ap-southeast-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-southeast-1:5f0c1392-e800-448f-ae14-0d87ed56fb52',
});

// Create a new service object
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});

// A utility function to create HTML.
function getHtml(template) {
  return template.join('\n');
}
// snippet-end:[s3.JavaScript.s3_PhotoViewer.config]


//
// Functions
//

// snippet-start:[s3.JavaScript.s3_PhotoViewer.listAlbums]
// List the photo albums that exist in the bucket.
function listAlbums() {
  s3.listObjects({Delimiter: '/'}, function(err, data) {
    if (err) {
      return alert('There was an error listing your albums: ' + err.message);
    } else {
      var albums = data.CommonPrefixes.map(function(commonPrefix) {
        var prefix = commonPrefix.Prefix;
        var albumName = decodeURIComponent(prefix.replace('/', ''));
        return getHtml([
          '<li>',
            '<button style="margin:5px;" onclick="viewAlbum(\'' + albumName + '\')">',
              albumName,
            '</button>',
          '</li>'
        ]);
      });
      var message = albums.length ?
        getHtml([
          '<p>Click on an album name to view it.</p>',
        ]) :
        '<p>You do not have any albums. Please Create album.';
      var htmlTemplate = [
        '<h2>Albums</h2>',
        message,
        '<ul>',
          getHtml(albums),
        '</ul>',
      ]
      document.getElementById('viewer').innerHTML = getHtml(htmlTemplate);
    }
  });
}
// snippet-end:[s3.JavaScript.s3_PhotoViewer.listAlbums]

// snippet-start:[s3.JavaScript.s3_PhotoViewer.viewAlbum]
// Show the photos that exist in an album.

function paginationOption(pagination) {
    let pages = [];
    for(let page = 1; page <=pagination + 1; page++) {
        pages.push('<option id="'+ page +'" onclick=() value="' + page+ '">'+ page +'</option>');
    }
    return getHtml(
        [
            '<select id="selectBox" onchange="viewPagePhotos()">',
            '<option></option>',
            ...pages,
            '</select>'
        ]
    )
};

function viewPagePhotos() {
    var select_id = document.getElementById("selectBox");
    let page;
    if(select_id !== null) {
        page = select_id.options[select_id.selectedIndex].value;
        document.getElementById(String(page)).selected = true
    } else {
        page = 1
    }
    if(page === 1) {
        start = page -1;
        end = start + 10;
    } else if (Math.floor(dataGlobal.length/10) === page) {
        start = (page - 1) * 10;
        end = start + (dataGlobal.length % 10);
    } else {
        start = (page - 1) * 10;
        end = start + 10;
    }
    console.log(start,end)

    let sliced_data = dataGlobal.slice(start, end);
    var photos = sliced_data.map(function(photo) {
        var photoKey = photo.Key;
        var photoUrl = bucketUrl + encodeURIComponent(photoKey);
        return getHtml([
            '<span style="margin:30px;">',
                '<div>',
                    '<br/>',
                    '<img style="width:250px;height:250px;object-fit: cover;" src="' + photoUrl + '"/>',
                '</div>',
                '<div>',
                    '<a href="'+ photoUrl +'" target="_blank">',
                        photoKey.replace(albumPhotosKey, ''),
                    '</a>',
                '</div>',
            '</span>',
        ])
    });
    var htmlTemplate = [
        '<div>',
        'Go to page: ' + paginationOption(pagination),
        '</div>',
        '<div style="display: flex; flex-wrap: wrap;">',
        getHtml(photos),
        '</div>',
        '<div>',
        '<button onclick="listAlbums()">',
        'Back To Albums',
        '</button>',
        '</div>',
    ]
    document.getElementById('viewer').innerHTML = getHtml(htmlTemplate);
}

function viewAlbum(albumName) {
    albumPhotosKey = encodeURIComponent(albumName) + '/';
    s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
      if (err) {
        return alert('There was an error viewing your album: ' + err.message);
      }
      dataGlobal = data.Contents;
      href = this.request.httpRequest.endpoint.href;
      bucketUrl = href + albumBucketName + '/';
      console.log(dataGlobal.length)
      pagination = Math.floor(dataGlobal.length/10);
      viewPagePhotos();
    });
}
