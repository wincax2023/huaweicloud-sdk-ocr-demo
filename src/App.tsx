import React, { useState } from 'react';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Upload, Button } from 'antd';
import type { GetProp, UploadProps } from 'antd';

import core from '@huaweicloud/huaweicloud-sdk-core';
import ocr from '@huaweicloud/huaweicloud-sdk-ocr';

import './App.css';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (img: FileType, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

const beforeUpload = (file: FileType) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('You can only upload JPG/PNG file!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Image must smaller than 2MB!');
  }
  return isJpgOrPng && isLt2M;
};

const ak = import.meta.env.HUAWEICLOUD_SDK_AK;
const sk = import.meta.env.VITE_HUAWEICLOUD_SDK_SK;
const project_id = import.meta.env.VITE_HUAWEICLOUD_SDK_PROJECT_ID;
const credentials = new core.BasicCredentials()
                     .withAk(ak)
                     .withSk(sk)
                     .withProjectId(project_id)
// 指定终端节点，以 OCR 服务北京四的 endpoint 为例
const endpoint = 'ocr.cn-north-4.myhuaweicloud.com';
const client = ocr.OcrClient.newBuilder()
                            .withCredential(credentials)
                            .withEndpoint(endpoint)
                            .build();

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj as FileType, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  // 识别按钮点击事件
  const handleOCR = () => {
    console.log('识别');
    ocrRequest(imageUrl as string);
  };

  const ocrRequest = (url: string) => {
    // 以调用通用表格识别接口 RecognizeGeneralTable 为例
    const request = new ocr.RecognizeGeneralTableRequest();
    const body = new ocr.GeneralTableRequestBody();
    body.withUrl(url);
    request.withBody(body);
    const result = client.recognizeGeneralTable(request);
    result.then(result => {
        console.log("JSON.stringify(result)::" + JSON.stringify(result));
    }).catch(ex => {
        console.log("exception:" + JSON.stringify(ex));
    });
  }
  

  // action="https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188"
  return (
    <div className='app-container'>
      <Upload
        name="avatar"
        listType="picture-card"
        className="avatar-uploader"
        showUploadList={false}
        action="https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188"
        beforeUpload={beforeUpload}
        onChange={handleChange}
      >
        {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
      </Upload>
      {/* 识别按钮 */}
      <Button type="primary" style={{ marginTop: 16 }} onClick={handleOCR}>识别</Button>

    </div>
  );
};

export default App;