import os
import re
import cv2
import numpy as np

from flask import Flask, request, jsonify
from paddleocr import PaddleOCR

app = Flask(__name__)

ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    show_log=False
)

OCR_REPLACEMENTS = {
    'O': '0',
    'Q': '0',
    'D': '0',

    'I': '1',
    'L': '1',
    '|': '1',

    'S': '5',
    'B': '8',

    'Z': '2'
}


def normalize_text(text):

    result = ''

    for ch in text.upper():
        result += OCR_REPLACEMENTS.get(ch, ch)

    return result


def preprocess(img):

    gray = cv2.cvtColor(
        img,
        cv2.COLOR_BGR2GRAY
    )

    gray = cv2.resize(
        gray,
        None,
        fx=6,
        fy=6,
        interpolation=cv2.INTER_CUBIC
    )

    clahe = cv2.createCLAHE(
    clipLimit=3.0,
    tileGridSize=(8, 8)
    )

    gray = clahe.apply(gray)

    equalized = cv2.equalizeHist(gray)

    adaptive = cv2.adaptiveThreshold(
        equalized,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        5
    )

    adaptive_inv = cv2.bitwise_not(
        adaptive
    )

    return [
        img,
        gray,
        adaptive,
        adaptive_inv
    ]


def bbox_area(box):

    xs = [p[0] for p in box]
    ys = [p[1] for p in box]

    return (
        (max(xs) - min(xs))
        *
        (max(ys) - min(ys))
    )


def bbox_center(box):

    xs = [p[0] for p in box]
    ys = [p[1] for p in box]

    return (
        sum(xs) / len(xs),
        sum(ys) / len(ys)
    )


def bbox_height(box):

    ys = [p[1] for p in box]

    return max(ys) - min(ys)


def run_ocr(image):

    results = []

    ocr_result = ocr.ocr(
        image,
        cls=True
    )
    print("OCR RESULT:")
    print(ocr_result)

    if not ocr_result:
        return results

    for line in ocr_result:

        if line is None:
            continue

        for item in line:

            box = item[0]

            text = item[1][0]
            conf = item[1][1]

            text = normalize_text(text)

            digits = ''.join(
                re.findall(
                    r'\d',
                    text
                )
            )

            if not digits:
                continue

            results.append({
                'text': digits,
                'conf': conf,
                'box': box,
                'area': bbox_area(box),
                'center': bbox_center(box),
                'height': bbox_height(box)
            })

    return results

def find_best_number(blocks):

    candidates = []

    # 1. Уже готовые номера
    for block in blocks:

        digits = block['text']

        if len(digits) == 8:

            candidates.append({
                'number': digits,
                'score': block['conf'] * (1 + 0.1 * np.log(block['area'] + 1))
            })

        elif len(digits) == 9:

            candidates.append({
                'number': digits[:8],
                'score': block['conf'] * (1 + 0.1 * np.log(block['area'] + 1))
            })

    # 2. Вертикальная склейка
    for i in range(len(blocks)):
        for j in range(len(blocks)):

            if i == j:
                continue

            top = blocks[i]
            bottom = blocks[j]

            x1, y1 = top['center']
            x2, y2 = bottom['center']

            if y2 <= y1:
                continue

            if abs(x1 - x2) > max(
                top['height'],
                bottom['height']
            ) * 2:
                continue

            digits = top['text'] + bottom['text']

            if len(digits) != 8:
                continue

            score = (top['conf'] + bottom['conf']) / 2

            candidates.append({
                'number': digits,
                'score': score
            })

    # 3. Горизонтальная склейка
    for i in range(len(blocks)):
        for j in range(len(blocks)):

            if i == j:
                continue

            left = blocks[i]
            right = blocks[j]

            x1, y1 = left['center']
            x2, y2 = right['center']

            if x2 <= x1:
                continue

            if abs(y1 - y2) > max(
                left['height'],
                right['height']
            ):
                continue

            if x1 < x2:
                digits = left['text'] + right['text']
            else:
                digits = right['text'] + left['text']

            if len(digits) != 8:
                continue

            score = (left['conf'] + right['conf']) / 2

            candidates.append({
                'number': digits,
                'score': score
            })

    if not candidates:
        return ''

    # Удаляем дубликаты
    unique = {}

    for candidate in candidates:

        number = candidate['number']

        if (
            number not in unique
            or
            candidate['score'] > unique[number]
        ):
            unique[number] = candidate['score']

    candidates = [
        {
            'number': k,
            'score': v
        }
        for k, v in unique.items()
    ]

    candidates.sort(
        key=lambda x: x['score'],
        reverse=True
    )

    print("\nCANDIDATES:")

    for c in candidates[:10]:
        print(c)

    return candidates[0]['number']


@app.route('/predict', methods=['POST'])
def predict():

    if 'image' not in request.files:
        return jsonify({
            'error': 'No image file'
        }), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({
            'error': 'Empty filename'
        }), 400

    temp_path = 'temp.jpg'

    file.save(temp_path)

    try:

        img = cv2.imread(temp_path)

        if img is None:
            return jsonify({
                'error': 'Invalid image'
            }), 400

        versions = preprocess(
            img
        )

        all_blocks = []

        for version in versions:

            try:

                blocks = run_ocr(
                    version
                )

                all_blocks.extend(
                    blocks
                )

            except Exception as ex:

                print(
                    f'OCR ERROR: {ex}'
                )

        if not all_blocks:

            return jsonify({
                'number': ''
            }), 404

        number = find_best_number(
            all_blocks
        )

        if number:

            print(
                f'FOUND: {number}'
            )

            return jsonify({
                'number': number
            })

        return jsonify({
            'number': ''
        }), 404

    except Exception as e:

        print(e)

        return jsonify({
            'error': str(e)
        }), 500

    finally:

        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == '__main__':

    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False
    )