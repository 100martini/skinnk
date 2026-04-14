function deadLinkPage(slug) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>skinnk - link not found</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#f4f1ec;font-family:'Sora',sans-serif;color:#1a1815;display:flex;align-items:center;justify-content:center;text-align:center}
.box{max-width:400px;padding:40px}
.face{font-family:'DM Mono',monospace;font-size:64px;color:#e2ddd5;margin-bottom:16px}
h1{font-family:'DM Mono',monospace;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
p{font-size:13px;color:#9e978d;line-height:1.6;margin-bottom:20px}
.slug{font-family:'DM Mono',monospace;color:#c44d2b;font-size:13px}
a{display:inline-block;padding:8px 20px;background:#1a1815;color:#f4f1ec;text-decoration:none;border-radius:6px;font-family:'DM Mono',monospace;font-size:12px;transition:background 0.15s}
a:hover{background:#c44d2b}
</style>
</head>
<body>
<div class="box">
<div class="face">:/</div>
<h1>link not found</h1>
<p>the link <span class="slug">/${slug}</span> doesn't exist. it either never did, or someone deleted it. either way, it's gone and it's not coming back.</p>
<a href="/">go home</a>
</div>
</body>
</html>`;
}

function expiredLinkPage(slug) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>skinnk - link expired</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;background:#f4f1ec;font-family:'Sora',sans-serif;color:#1a1815;display:flex;align-items:center;justify-content:center;text-align:center}
.box{max-width:400px;padding:40px}
.face{font-family:'DM Mono',monospace;font-size:64px;color:#e2ddd5;margin-bottom:16px}
h1{font-family:'DM Mono',monospace;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
p{font-size:13px;color:#9e978d;line-height:1.6;margin-bottom:20px}
.slug{font-family:'DM Mono',monospace;color:#c44d2b;font-size:13px}
a{display:inline-block;padding:8px 20px;background:#1a1815;color:#f4f1ec;text-decoration:none;border-radius:6px;font-family:'DM Mono',monospace;font-size:12px;transition:background 0.15s}
a:hover{background:#c44d2b}
</style>
</head>
<body>
<div class="box">
<div class="face">X_X</div>
<h1>link expired</h1>
<p>the link <span class="slug">/${slug}</span> had a good run but its time is up. like milk, but sadder. the owner can create a new one if they still care.</p>
<a href="/">go home</a>
</div>
</body>
</html>`;
}

module.exports = { deadLinkPage, expiredLinkPage };
