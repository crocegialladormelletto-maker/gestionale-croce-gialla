/* Croce Gialla - Note di Debito; accesso esclusivo Amministrazione.
   L'invio email apre una bozza: l'allegato PDF va aggiunto manualmente.
   Nessun messaggio viene contrassegnato come inviato senza integrazione mail. */
(function(){
 'use strict';
 const el=id=>document.getElementById(id);
 const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=x=>Number(x||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'});
 const niceDate=x=>x?String(x).slice(0,10).split('-').reverse().join('/'):'—';
 const niceDateTime=x=>{if(!x)return '—';try{return new Date(x).toLocaleString('it-IT')}catch(_){return String(x)}};
 const isAdmin=()=>prof?.ruolo==='AMMINISTRATORE';
 const FIVE_X1000_IMAGE='data:image/webp;base64,UklGRnQ3AABXRUJQVlA4IGg3AACw0QCdASpiAvoAPjEWikMiISEUGNVoIAMEpu8Tp6AHkd9f1e33RaTMT/wf5JeK9b3tv9//Wb+5/8v/X/OjZf6d92/6V/uv+D+DGChkn7Zvcc8t/U/7v/ff2T/tH///7v3o/1n/W9kf5t/3nuA/w/+Xf3f+7/5X/af3f///Yf/oeqL+1f8L/hewL+g/0T/Mf4D97fmw/5f+q/sHub/w3+R/wf+A/wHyBfzr+j/fT3sn7hewB/MP6p/xPZ//2P/R/y/79fSL+xv/O/y/79/Qr/Mv7X/xvz4+QD0AP+n6gHqf9Kf7N+S/mV/Qf7T/d/2i/s3tX+K/N/4z8h/3J5lfk/99+KHst/Fvsf+U/rv7ifmp8f/sB4n/kf8Z/zPUF/Ev5j/hvyw/t/7UfRU8w6N/d+gF7bfUP85/k/8Z/6P6/8W3wn+v9C/sn+sfwAf0X+wf6j+7fvV/kvoj/q+A35p7AH8j/tP/K/xn7t/736YP5n/qf57/UftJ7Zfzj/If83/Lfl19hv8u/qn+4/vX+M/9P+c/////++D2DfuH7Ff6+f9b8/zVJMh3BifHSZmpk36EkyHb46ExxKs+0bVCt+hJMh3BifHSZmpk36EAN3bN6gjnCgekOPYkL4eoud+muESTBaYrCbLi/zFn00/Yq42SRYaIZKgIg/th0Rlr3F2XFZpwcEjlpdTFRTjNp8NCkyHcGJ8dJmamTfoL97m0jOIqE1Ve30mDuy6du1II1ULAXzFNxZNFIvwQTWEWZJx81/jz4rWytcna1h/vKDIcLjRhG2vwRc28GaBem54eGfdUnhkqOG/Va2C4u5Dt9zqI0vl+We6tkaDSbJYGpk36C3wO52dDFBv719qnE+u0XN2T047zsjrQLKQ2LMW7AZgI6RodqBwAlWOpBgbEMldjTUjVd2xzrqV0g8dbBhOaICrt8MfIUSU+NE/dyHXJcPU0ZgMk5qCkUSGMmhvbM/EzWU7IzJviUtnHiAjnztipo0UZQo/dMwPw2qld+/e08+7BJdXaG1PljkvkfzDvHcGIFyIvv6j7VjVUv8qW08so9v4CmBrsHv42KX+kz93IasRkbfY2CS/vpsb71PcTAoiwG9p6IJXUv5dqlyRRGPPLBfZRhS9om7E6XofhCXa29c99A5KuZohamvtm1rDTD/ZmZ4cRdY1S9pHkRpcwx76W4dmoBo2QImULJMaens1xYmwueX7xudnSOHz4dJzGhtUwed4hgE+ObNvEIckVJq301UST17l0TzSGBQyExVYKHDB1X5NtNB2DlvMHRKmKD9G+YuT4lPgsHRbGUNTGnZhnwDiLVEbmv+PssIniawE59qaToBCi7dgmI8iWoSegQz0Ffs2yO51SGJQF2S+GOffq4JdqSBz2dzoQHbDh+v4bUKucoyFLL6L9EIpal/jXPkg4SRH/cvsIGqq3hLOS+EzM7ajTqI8TbPEdzL6zVRndKtTCWCpj8paKWqzesJ/POOeRxVmL+V6oEN3Om7Vo8m3B2bl+Qw5CzXnxfr4Znn9J1A8RGWheBw4Kdbr+O7kDtfKm9CQGh0woSQWnOfb0+GEVrmwuYNjSoBF5K1A4NFFlBZdbvj33MaVLLsnb71HZVw8oebwxNP01qLUn2XjQQAxD7QLKKc6P/m/bWT+ULMTBofH1BV+FADs5aU24HiO76aer1nnQG6yLyAOWktA//F9+rb1vbTo7gmjd7x9Gp4Rd5n4Ynx0mZpIFsgOkVFiJi2r2dkTl4rgdIS+2CEJq+2+H993j/RofMfkCSncAbpYEy3t/8+IpbH9WiXIuJHV0f/HtPvpf7oBiIV73yvVdhEbpg/f3QXrYLGzMcvOzIVDQcPZwt3Yfgz4bYYP37NrAg9iP9T3QkmQxPvgK6h577ifRNfloigdgTIL9kQizdQjuyYxsDAdwsINf7ee+M4J2SajkfZRq3SwKXDPoOCBccgQAxeuvMVR7ifYfiVuvLUb7kTIO8xXJXxwbCvAMxYdJRRYLcyOkV/AM3f9YfhNoYJg/06sx0AZwfoJ5wzj+aoY/POoSPM2U0HyJ/de4zxPTfHt5Hd9sgR/0zDBqS/b8BnQe5qPIQNX9pDe6EwGSl4446N8V5ckAjhBC6oL3XNWN32wfNrrtmmQWgVf+ZjopnCuJYn8pRqoBChaGa0u9vWJ1g9PaeACPJFaMg+U7ayJMzUycD6MgST8l9wYnx0u/x3kjE+Ol3+OkzNTJv0JJkO4MT46TM1Mm/QkmQ7gxO0AA/v/e7gAACOepSznVB3VWdlPpA2Da4o1jhYm9Cx9Xg8sIOGJUsEKRHqPmHVO4AwhdartGtViM3iltqYBu9fvANrfmWfFBYMBrRzZnRN9dTbojAAACuTpKtvdtz4qFqR6xReyqzIIiv55x3715cU2aIiS1+kME0wwCtB/XkLXiWBiZin9POOZFC0nFYXuvUMWKxom7GCHy2g/0qabbr+IFadA1fr2BIUWGYG5Jm45TrT7+0inANKaWc3GqHkf5KBElqVP5m+seaWj11JYyyVpuTMVC7V/Gs3iynM014qjBb9xLHrCPKGkyxw1jB6SPqD9kOZF/gVEkDjM/ltjqDv2/UuTDbFqwFPRwqIMUaPCwQGWtQ85u8715go/4sVT4kpvG4K2OkVtquIUr2znHj1T/SrzRB00AqQGbxCeyx+I+5cRV8vhBzNm5rUmf7zC/mqc+OdNYZ0nnmH8OYCicw9xzQIXJ+O8PUpDtbT9I8QS01sXmbBHST1I6bWlIV1vBqiUg/BqPlvfJAyDNwbo57AnCOXxcvQekfvlxthnX67wIsw5uWASNfospkYWsuH+4h/PTaePna4lpKUCFRjO4XwfeXXgeEEdjNIvBOfAtyy5yCcarW7AFjPa2XIsHMyjhC92TvZfXVB6fxDimIepE9zRez09OUsjEDCLjS2ZuZrtC/qvsyDg+6StDX/TRKZMnhiVpVqfbtnnOhhIdkY6Z7XurKmWB9/nhia8jPrVhvPnt0a6pqJT2OjFbb9hbSj/YTJb480poRCnPHH+Uzhw/hKDcOpGwnuPe2rSwsVzocxMPG9yx+gSBhgVhREQy5wj8Eq1kpsN3jWdwPxHoWB/YmTPb01ZouBAey8swCyrHr6NDmNxnPEMK6evFm/Sx1OMi/1DTIoTXfh7IO3vjg4rrulr8qcZuEXhswhzftIeNsrSbbMkYOPFb73L3BX9ENLquQKTgUGE7hC85mjKTdK7Qggmnrykvv16RasVNG/eM0CIMfAS8SQxKXWcM5L/66faOZ2CG+fVImzHFOxi0hJ+Q+7Jqhwj4l0++P8QqJHmZlAV4ndq6nk6R+5y3feUF9AsSb6ZFICAR1jCJOI54RzO9RYrApTZrCD+MYpuKc1cS4Dmxnluh6u24xettgehFYA1hM1dH9m/QBxSE9Myn7Gg31tfQSDXCpQulVOhW+eQSHWtxqS35IyFOqRrjMzm0uGSdu2QN+mNqOsI4OZKUowgOwCp2FzJkn5IrVeX++jfOl69BALDRgMzTIxrO5mc9JC9SABFIcqKiuTljQkGefUge+w5rSeMChUMyfuUnhDAAA4YlBklo43B7aV25gpDWEhlZrol78d2+5CHjA7AVga4/9AHA307s+5+O2trOEs0ZfWYq6dzS6nsnuxpjJyQCfOyJkMavOY817zKuvyldHQOQv2S66eAAy0cpRXq6l39f3fB6SejoeABSa3dNSnST3x+cUSMpTBUlCFrLJe3s0Bwvciv+a3mTcVDaOT49r4xiRO4ShoRamSJD0ewvC4eme5sCcySdOYybgzZ0VdGOWeMlmVc8TljFx4V2TzyxViw2oA1j4JFnxgiUsJK3wRn52MtMQFt6HxaHMR+ia9p3uDoFvl/bA9kxM6vajd0/VtBOKD7YEtl5jsogHu+ftg1MSSiL3/ePtAHJiX6kUaD0DQVHqBOg/UvIJNkRon2ZOLYmpRfxOgwevY2PIhhQvslQVLiV2xz9olyoF6lmmclBierM/NlJBVRweoV8i0gMTnr3bBwTH4B7LgCdOln1rzasVtnLIBhAQbHUgnv/+Ye5d7zRjSRqla4w6VX2+GXYGwCNEYc1LbGk9aUsxFWtSGZWEgaOx8F0Llwcym1ixYbCsY//b6DqmvfB7+kFUYeFHqxNdjLH75k5birLEdHavV59SUs9fSn3bpW4o1s9yBTxmf4JYTfXUWrrLq7mTNjBoGIzNXOB2VtrBZi+MR34cF6hTzEV9aTGI456WTmo6ZQ66tNQX0GI0xM6o06QAMtSQq50wD8/UbS8CLsxesNHyV0rLSYVbXS1kG7hJTw1cCDTXaSJ99bitGhgl8c8z9ARXTnB4voW+/Me7FD5HL1RoBwfk9FmovhFEui8zAdKecnGUDMKqBeyXmv6k0zSS0S8yujijlSdgJbBJ65Rj3uABrHtmpKwOh8zkmP/IxJmOpAVRHfoHpfTKlhcsDChSfYIs0JbW8GfEB3RRS/IPwcbVmRJ34aBvr0sqWlLm0lE9hXNgECpYe/oSFEtdBcvVo5d1sTjAcBNfvJhffw/bNn3idIHgFYuRamTpdhDuoRatnh3yMaIW8fjrSTLS7iqD/K3rJdjYh4jEswOehUpT1kJb8K8tgFwRjbC1ikf+JGnYouhhO+0dXbA6/JY87hpvFR1pvlckZ+Ff5X7Xoa69djSRaTo2+ErD1K6YpLEH8dswh/CuEZvD4X454pN5wdmYYGwrclRrDuxvfIcyh8xpkFzkdloOFIopSTlw7BIZq5C5xZoMy35Dwu7E+gBvoYcnpm+SBtSv595CB0iiWa+sopsTyGEH1H6ZFz8AobS74jIb1cl/cchLjsKoAl6v7afRG9GoNYrOlUHxGxwt1RyyDATwZQenVfDvrVwJRPFbB03bTnhh18/8LUOHWe7nvzYCaONt6J3nM5fU4Qq+PKw3biSDiS+J3oRIf5A9fJOBD8Ymr9oBUAhQwkFjOojd0t3Y5uIQgMXcTQkACikxcy+jU0X9UhR3+cMtYo9b3xk85f2FaIzfcCZmlLZVN3QgrNsdkYSyaxvyaAfBb+mcPM6SeWyOy4Fgg2GdLvLoDZhhpCJpQHepzsvTVuoP1oOGsPWA6mO0WSTCUp5LDvXoTL434flkx1/JuBOJHrIbJjYx+ISsQlY3+au8geRP+gwiUUCwp5FEB5cpn6n3rC0HhgDRH1vZZY1cUpNsa/oJToKI3KhDUxfendnX123v1tk6rWRi1bbiZk6tU/VMBfBpw9O8WzEsnbRpkJ5+ZQkIuByGVYjqZyA+iR5fT1hc6q+7gCD7CSb1rQyJUM2CEWKVmVs0yMDX+i/AcbuHAX3z5AR12KSYl2Sdm7IMeq8FQaDw+6KPei1kmVlkaKnXiCefgqXej8gG5XkNw9pj0ECipbdq8dHBe4r5EFxYnhxLb03d7lAndrJ8hEsEMav8csiE5ISRMJ45nZtwk+dONm67v6Na4wdrYOQd13YTQsp5vtzOLT5/z5TTeLoAZ+wuLxz0KUztrSmTC0he6P6AnsGmtSa4NC1cyo7bgKFx1lzQR7VbysEv0uUJUyJbCe0p/8vwwb1NmZqOnAeWwTD1lFae56GHASVCIFUuaWyJTZq5BDqDbHueU95veRSfjtH6GHUD7d+dAic8yvcRLzA7EUu26JhyuqaesQZ3q6j8CQ/mWvP5jo/odXAANa6N+QJBlEoPrIp3OH/Q3YLUq7XqvPihVjqQXZmlYx+wqjyHJ5Ae8Vs4L2KP8CTMoaL4F05PO8BlNuMMkb4laBBt/4x9gOWeBqVsdq6tTc0AHWtzU5cDUyhEHA5OXxZUbn4FTrTC4hbfnETiK/XKUuTQKdr14p1rB0PmCrx4YlvPqVXfdRR8cL2kIFzALVAlJNqllvTpeIadR4pMNmHLd2NffP/ZRu8olmwIDAVzCndiRo0wKc5r9DRV778bZVcHIEft0WHfyNY4oQOOqrb8F5Pxqa5Erdi+3SKqZkazSjp738dKQ/Pj1+Ne/LTN27w4WlMfr7KWPXPTn4t8JN0FqdjtSvHqD62eZublHJpR37qTlovHdNQeZkwYXroWHfJxUTO9ZzBJ7/v1eT9+6aP/NLTbe5TLBDPcxq585jAonGHyNs43spOhjjtLQP7udnv9uFoYQS3qebImHLH65/S7QKBKR7Q+GySZf9+pOgVaIeTtKVN7StA0a4g5pUs5R4ak5mhB/fYTRs0qr22Cpdj4OeE2OsjNcZAqukpO/dqsMCuEcMz7NhIXB6aDuh433BXxCzbuN1jdrMzkWAsUp7PLjQMlh7T3LwEfD8nkHLXtoOy3LRz64gnFaDKut3YxHeVsFkG0r169D9X98ATijQ67goR6UspOAFuno9NwQRlI/ILfMRemvQzxhxSVCZfifEitQnA1LK6o15ECd2Diy2+K/Me0Evauv6XmoVRLRZfmqtle2gam5f3mlzl+Tn3NrZbJTzBaAIGfyFJ5qlvPlnCjymFFMnkhXCF7zAd23NEub6RNJBRHJdwAUpfIqGwQN2vbj2Fq8ibrl2XO+9HB8D61ti9WQgE+DTkJQNYJyWKJIYPuYXIkHv+Xg03yBwYsTB8nt0OKUQiZYrohaxkEoYQLRaDnGfeyMDv6EoO18rDeOqtKWDOEDf4ngP9XenpZHmSrT9uCEmNQItOX0Z0stPyUtWEij/zYwaAPEWUXbqHdPKy5gkmli2DIXS80SgXuFerR8AV3RJc3iQodpcP4UkyXuKywpbooh5L9BVL0/FIuLCR9KQ3XdffvD08uXxxWumY/x88YPTcFm4t6Gwou5FqkYV3dx33phcewQVChuOE9ItkPyjDfHkRZcNGXgKl51AZH9POA1v0ytvuU28AlYMBTm/H/YEUi9627tag3jqOWy6nneFnrgqgq+yiESQz0fHRNMEyyTsE0fzTOXSRg8oI0VgL8a4E1AyV+he/R8tQMzvxIXB0hcmhEKAzEBRSR0ZHE7SDFFl7CU/HDh1jkskzHd9qdxKHLyn7dxlQ1ShAOMpeblYKWZbUam9iCuCdgX+VjwsOA77H/m/jWIaMwBIzYh6N7E1CDFkb7T+hCafWushV/AEuRfWiwwlVRGRYwA5RYyk6O0JdeQlAmk0VSPI1VJU7pbhoSLL+usGfiYMMjuk3QbKF0X9WG+pn2LTuyhvwT5YT5BzIVmUVjql4yVyO5mzGhnhMAi65tjDK0yU07XvmtcMU4+54nA4Io+tzCcxMabLQWcyYErV3rqDQrjD2XsV9In69Qyy1KQsFGwtAgq8FzkUeVGRLrAYkL8phpU/KMGa6AE1YbF5QlsJe7o6vdBXud0NZkm9bv/h9hvtCb9qhCDGU+/gkHfXWy1a2b4K5nmCzYb5//vk5Mm6GePyeAKS6pO40e8Cf7fCxNob5LuLQsfaxC+Q2fmfSxAlbvp0rEeACVb41rHu9l0t19BaOhnIJAo7SlvSCUSNDaZabal39WJ2zvDIqTDsbxMVunRKi7+edLlGUr+zxpN8D5k4dZzp+D1wqBH7E7UqGqT+A7CZDvi/VDADlzuIos3T2CegSTcCp+Q4vekJMcYmbdx1JbizilWz23F5vdZOTF6/96dAS7pQVX5Ph4YLzRAjEB3/Fi8TPStRvDoFjhlyYIEWJpoPrlltcs37jOYXyp8KDqfIq61Ah1D5/BZHzU0cHNZrAy48WEIuTCNwxDrkYscXWprtmTUdPQ1zzClp9oZHvknj8PzLDPPg6wGOHc25+0nWhK4wURdhy+oeSQ9s0GANfIIZcyTRSFwg/GlvWVBPDZ0L+WbkHHNrpO+mF0SxlVFR4SE9xx/zJmKRg+Rcpg7tmoHviJ0Sdpalq9ow0GYqF081P+VE20A37MPxYVL8dmsZCml8sHUBEGx3gf/6io2kXI32FYJxAxm8Z11JhKsfotoWjfUst1IDsP13u5b0Wwr2SH+sTIWIGqZd8Wm+xFekrWgz25qL357qVnpwt7n76UZjro8Ix7GUcKS729cZNAUWtoCZaAGt9GiOtV1VeqwuAOhtxx51NomdiOQSSW9nhUgnnTJTBS4qZYjv3eoSVJ8tr2Y6oC2aa1LOlnbonp2RbOSIG6MUvxXkC7rk5bfS9ywvcX83+PhCvHvBskKeQWngj/PHgv+UKqoXeK3Z/UOsw8jm5iPi5qDIT2zF7fvAhKATGmXfCYf4UHHoha7O1+ewVUqPY7/AlBGlkscvPVqueoG0lxg/uym/MWVtpqf43tQJxcUdwP614N+k/nyPq2zIlI37sOVNlHYRki6xSqUIURYq26qN2i5QHbLMou4spJHQxYEiH8HhhpyvLbhwlcLUnH7pcWbyWyLb05vq3DHDn8h05GnpnthdlrEIt9fCFTaATf/XsPRsdyr0W24Rd8+EMfSndpdeRiZGSpHYkiZhZ48f5lcLPPsokxc8jZtI5xIQqLx4BObuUsXLcAy3+/m+Tpg26AQmH+rE2y4lRVofEvWa/ALFkpsEv0fy/csqiMgun+xFz9fIOvLZFFnD1yXQJGeG8QToTrHK9cwg0IeQgSUHdpAinsbbtTcKXyusNTqIvAxMJWQul9Z1Ay5tUc+G/ebfhsFOI9bcRzpHq00zhdGZnjt+wIGWAtKVtEbvTAMUoVZuipjUMI2Uwf9I+uaMx3LWkVDI+xh9EDn2OxpE02AouCTB/hFyO5w0cTA6SnBn3ikOA1YZ2lpx1tyqaaEkiReGUNr4PWUrVQbpI2Hg3Vl52WDMKayfWEp2i+vMa04TrRMtbnunweqoMKSw4xyz3UrGS0vihVzXVut7UjQSsPhLXR39kV0MXG335+oLrNNJYqdkKRUm2oIAS5TPDiB+21YUHpggyUR7kz1p1gAyMDC0cVjLuPsuWZ6ENi8uRm3tzmo22lvYKwHWIxwH4m9mspQaO4C5bq1BG3kWO8A0XcO/uJS2kbcV9Lbv935ZT1erO2jYO9Sz7dubRNuiD0mrwEK1u6ghU6aoEWDDhdUnSrYxBdQH9FvQk0UlwAEALssYSyTbOSbPTK/KjkcPyBT9mx9lZL28dRf1Ky2dLi6rDuwOD2Py7U6ukTtGktDEX9UsDPfTxR5A2dYZ3GN6tDfrEBMxL5jygAHe1vrvBHh1AItnC+645u4JqK0/vUR793PtU4HD5btybzWvWNEIQxlQ92HI36YizQRH+GrQXwQXsyH+tn5iRqNZXWOt7Bkk3HwEiUOmrudHuzUmrUcEii4qCH5ooyxNpNCrwZyktVV05BjYc8CegcRXC2xjL7pLgw0GEzbbaCXOilUQYKrX1RFylqnLQMASb06Xs5XNIG6FpQstFhT5rTlevPC4VbaIt758F/wNSCoteJcHO4SQCVBxBBuXKZDCASLOPdLeGsd2jYMtAZ+B9XS+QDEsBFbSEXzmn4lwEXjCT/BpppJvhxUz5tVL3ea6dEqS6VbKMg4+ziMcfCbs+M+7qFZYTxU/FD7xZvYzifjv8iiJ4ThNWmrNiWCX5i83tdEQn/v/kv+6IVN+QmnWSrbpwpt27eK4yHz2Oo5kHWhHy3MkVpn5npd1k2bLrVVjwehyXg38n//1FlefDr6I4IbLkeWGJdyXX3lYkplPdQPZE0DncBbq1q4TfpQ9zCXRFkZP6EtXByDNB/0BGTSM4WDbRxnNsRuNOxHGzJWfu9+x86b/fSxw1Teb8pI2NdbFWj4p5E+JNHgox/pe8zu9xGo9cWQNkvC80CwKUBVuOqlg38xkGAoan8nKr530nvZB4jNuY2nxglGKOsz3k/L7qLZoq8fJmUtJGtSwAhATp2IEYNk7rjbHXOjHwveFo6guGzEsrZoAQS8hBscJOu/7Gem3n+QhyjXfba36TJQ1A1zcJQuHTw46YSybhvWhOXgQD4Ci4HWRD54L/N6nonr3m+IOcP1fLcp7+nL1L05leipnk3Nh5K9PilkpuBXWuG7i3RoMz/Stvyl5xPMYDdOzm+MQjGlgB6wPiR2gaNFj/hux9SX7l6Msv9WIOAO2NmEpcz1GQ5+7wbqagX02xcvvbOA56c7KeyVZ2qWrVgMgXVLW/M2iBkeSJmV/lQjsopg6nk1Ncq5sl1RmDux3XISBYS1LtUqOhUfZ3MqsZbVKd520GxX6VnTiEdxBkGNsjr1XErLz0f9+U4HOxv4Bz9fUkLQ0JhYim0HWqu5G6BW2OQ5Tcc/U13gW5qbNfpjsPIi3xfKW17gXLRJfH2mWrRxWaA9H+/kpTMd1FwKt9tkGtlQYn7hgov+SeEd16hCjjDbzu1TMDev6gK4Bef0hKAoBpQ6pJfbQBBIurRXn0T3nGn1EVG2ER7gcM97rob+9q5tH0iTxtOSPoRjay3YqcsidGuY4bDjYlBP/bzsN2OXpI8ktDFYBOHVdPFT3p/jDaC7pNWrrPXOcVNR7nywfB85oPEfrRGM2yYFT7slDom1jmSnuTo5UEocXrIpH+Eh53DZ5p6YToPobrwJ0rVsGAjQS86P/8k2h0p7N5KtSqvq2ZvPOgmQ9aHKUPCTDMzYo9H0DYpc6NZgsvJDdAE0FkSilrYMsWnlT7CbEqTP6dwarUyXVbwU5k3YruSn+5A+OtpA9kh3J6SvfWdqHqtDIU+hmK5qq1ibFhD49Deg1Y1UHssQetzC+gBtItFcLuAGBO+tmGXPuIWtsicTBbRq2NN1xMiAHJP7OFZafsWpzOspkXikuoEPOvnSPrJ4eBdDZNw5SPwUCuJU8QWjDVenvLUyIHtD3TzSMgx7Lq+3hO6gghVHFXGtutPRvg5Zr3kG6FeR6g/4d3DiVNQaIX5plZJuTB+nQHL4kk2XHfZaGTwcThbwvEEd2Nc253qsrxxxj+eLfeuevObL+RK/cYdCslJjr6OIljxvDsc4oOphZWKH1o/S5DOIqk0nEdxokK4ozRS4eYUbr3jGJKfE2wmiN805RyWnioHUU0p03Kj7e9oQ14sRHnG391/1zev75NcMxL+vL4+qeyAeJndTqul/9Lxy5BKovGZTN4zKFwO/W1lmU6OXXIOqL+KCzwirsMa48MENUu9T16lwRNqLnbTzoy9fNtyV31uCGN2yiA2piV5wX3/Q9U36EUZoyeaI55/5PIb0D3O6aPZ9WzT0zn9WdmC5OAdA4fMsv3CvOK3gti6Wsbp/vLHBJdLjsFAaLAW9fM8q+jZpywHHle94h+n65A8kwvlKx5yeTdNPfsc/Ro5n5RKYe78rZ/RtINjb4w41BhpniiyvlP4VuGmP2us7xMU5x8WGCkKWwzTNljqANLiociUcYhvR4WbIq9kKH58/siqGC/0V+hJXDyyXHWenPxh4E/aoTi0eC4xhGnKNY6r+yOEkZEjP2jHzb/yE/x/v7jCLhnqZmzooOcs9Q//Ey03fnFWiccHFICrLx8i3dRTds+20dc/us54b0ZZlsy/38S3ii0UKHy59IocjqqjleoON4xDlPYF6bCWmukA1tYCvDzavnrGjAks/9SqBnVjacl461Mt08PZ+py7v7I7zjvDD1OJc8NS+N+qHMdQSvc1e4A1WVQNujiP5HZO5eW2mWqcChJYnoZyuw5iaZJcZZLMRalXydWiDFjTDaWnM/Rq+Uf5SmFw/S91OFv5HmGV5uZ0gv8Bi3jErTiEYTSdmVgvFR31HB/lYz+hmugbJiRlSaI40HZY3Gm6P03U7NkNBq+9yi+6ARUjANajE/MLe0mcG/GipzYyakgElYb1wErC1ET5OVhxZuxBUhUKu3UtEkXD5IMjpczl7BOgSrgPYXZCtvxtLG6lPBUiSLz0EHbLllWTlyEPHVelYGIP6eaovjpi4ytNKEewpbIB5psJF/2JoaK8yKs/klXwZYArRhAHx9+QS8+G804i7bIJmb3iOWX+hvkBC61r3/EeQyTEpI0r2KNXJkzMujXlxZIihJlrU+uUI1La0k/foXBmUqrtj5CrZ0RTXnllQJWci3k7L6h2xwZSUeEQK9Oh2Eq2l0PXI8EMb/PB09NODnp/2SPuyJ83GnBmPAM2kx4N3RjT3MrnHH1AKOSzwYZGKGAMcXukywfjn6egfACJneGeGrUnPYcJiWxn6dEWc7RbWMPRHZgHCtXQIDWqrXudnSMsl/XWo5exob0MIyrUGMTQ+p5YzC+T0R/qarD1n46UW3Pt9B/TO0Dw8xck14UAinETHBqSNbii6flZ5Ywjeq4Oafdujx8QcCs8ski4Znyya2mfNFitHTMr8/EwiG9RH+F/QMZl3p/1laM03vtYr3QbzQkWeHzZCr0diSv71s3tHbAl49QaU+gZ3OiO5BwqGQyuJGl3chJeGMW8by4y9dk+JEjSP3DosIG/XnPcFyVhSmoR2zpytlY9sgjooEGMuo+XFX6las/1sN/OGwIvr507gLof4ukT5bszQaDf1SmQB5TwJFfPPd6gPTKRZU6FnN5E3w4wtECz6gn3JbyPqAkzbpbMycyz9B0OrIg81g446RWIepXDhVyfXXWT3fxfE5wZmysLWmgbJUW45BYifw/fEdXBLr6UzMpbdhb0Eai7+Z5sHnqdTwh+Gp7Pc854vt7aLcKVOdsWeio52W/A/eH8WCG/FVNB6YeB9NWt1IEy9TsKXE6FssY8fNNofmqB+tf1cKdtqAjlH6N8H8M22WmwcASA892ysec8W6LA0kGo7EHqGQWKi7P4haJDdSufGd1yqTnkCxlAwXWBYXGstfhKQ6x/Zn/OsblkPuh/CkAL7iVunbSaoV5vrctjFJMUH8uojwxXyJPiUjn07UMVH41Alv3g9nF0GeAIv822cEMnxeHJot24J+zUhKT7j5uAxWN8++ujgSWw8Y9HGCLSjWjhxx6eIH0WuDKDcj+69oFGbE+C5YJfWYMUczgXlw0QWxz3TGRbCUznL5207CcKfUm5tVUpcL2lPpfjAEdmtoiZBfXZwzRDxAAf0NAHk76ZhXlWUv0sRiSJnYqfmbIyYHT2qBITm4/pvZJcSnX61Fv9ah2oGN8VGnzFL92EmO30NAWfAedg91UGBV/mCE4ORqR9POWYtzCBE+R7D/b1GN7kBth7srkfyLs0ALSQwMRaOfApm6wNi1F6yFL8lS6QQbEHajYjBXyv2gwOi7L0T5cNY29Q+T7dPYdlewvbQAYCE2Kfjt/jqo06GFJ2qesTzmyX7AXpOeAn9MU/mQ2KHNZ8EDmodqyP2TuYNIAvkX9IvxMxK+5LCOFmFXnOuez8BQ6cEOXcnLOAcyQ1k1BMY82pPlKhM+DoOTc1L/bV+h+kfpjplrCGCSAlFii/hxhDuyrZqcGc4W3nCRd30rJdH9/QetrFV5iQ0mrQ8gJR1095pxyH/+IDyBqqrA8wNlpxG4Cvy2wFgjDmZR4sNhCHrJwUUAEWc6LYc62u/eAen1SRV+ll0dkqd9xplY+uHpUVnLBE20kML1zRrKRlrV4X+WGOXAMA42WBkOPTW99ebukjBzHOR5fMD1c3qP1048SZfPoaYb+2SRrgrPhQFNSy0XLlbutbxGmDox64ppWldBIpf3Co+EHtp77crayhCGA9zMHR3l/l2cU9ZGl/V3WNn+hnhO0VhOrvWsaa5LDb/I9e8pFBgru+THrR8eRhU2CQuB+AgHlLpW4q66zFQ7TR31gjU9yZpVJoZKXiUK/pI39h6B11LIWmdE3SdmyLDKQhEtIthP3XyXrfVRBS7OdNkV4rmMHHJjCIWgHTzVnCmjmvyIbX5q66e+6UYzo7M83+xX0f4P8lO+X/tlvvPynSvxc8bijYHAc779Ri//u3rsCo/nXxhxi+0++PZQ60gBJ8socmk+QOH0r4Rr7YtiLCar0gkxv2/vZFp7OXZtai1Tt7FE/EwdcQwkQmSFcZKlSH5KMhfrAkRP/ia9TlvgmpaGaUJyeWAf7Kq5QrMstPsPGCmCi56O0kyuzwadvEA2meCyUttCqeorGhL8mLAVSknQdyoFhEcS4OpV981mQ0ij1du9gQQjaSI7h/Dn+H2XBA3AB/Ovz9Rvl3tBH9+U1mQB3ie7TbPYwxdeEGAVoxFNhGNlWepsFiB2yX1OdPWsUBXtFP/IT+Q7G20LvvzlSjTA2QVh/rQVsxzu/xn+w6+6SEYNB2slotMFSnlLX2wjd34ajsw6iD+fOG2kXFsEH7Pz7+XLa+bLGLDYh3gczVWDjJrV6kKabCDL51p4qDOY2NDmQXT/w3QSPBlgx0B6GILKWZKK0nmKhY4GdRxnUosfnw+NqwLp6MKNquL3ZIJFB7PYITF65i8ltXNaTdPX2bWhX9X6rEiGtwfD/06EZHVnKOw7tdXjDaOf/gZW4PBsq066vNZ7TbpeL6DNxpNkMLNZsXJ5jFBIjCEh0L6TxgBASyhzMKgWF+h5x2a/MuV536RwocmOnLiSj4l0DIlVgIzCUuOQg0KBh4tiOYNMOfdXWnBkcPI64rIDWdErVU26TZq4EW/Vin+y2n66Pw02AxxvegIIIzo/4nDmKxHP+rCui5unxHtlN9F72/RLoHiTDKf9OQIti8Ftjga6ty2T5jHLe5dUYD4eAXVCJ4h84fHegiUF+alHtV0y39zxuQPbsFh2v4cFgsTyE4TLg2SzPYZbpTvEACdaTBo1Q/kH7qlvB7U6zlFZK1bUGSPPl59lkJ7s/kFnBLP516PwaG0ACayRcx0F5AqkuCoZ2QkglfqmY+KfvCYI0kqv1Ygg7h83tu4tKrT/KFdBE9X+Moz1uheHOdBUpIiku1CSRAdbF+esh/q1T40TUcUSisUQ+zxVJsXLpHFjBcnDFb3G64Pl6xbK4s84pdxRLifEX6NBxcSSCo4NOb3Lf+7ouUdcJpoDScoeNNZzPB3Le9dtNJeuOijhNHfTvoRImOdCehx1eD5+P9kTycqIsy2RcAvG0vZEI8jK11JHsIOVHbgHXhtfuDqCZWOYKxo0lnfFkIhIIdXPc+eyHhEiXxxIScJmd7iAMAcZHLvvEV6p0v3YY7hCAg9RHx3+FYfuUZ6XVp23iLXJfp0fw0gw310f0KFUjsGz9DNXVoMk+Svp9QoX/0j/Nn7IGywj0hem2/vXgdo7XsnqVeS1UZFz6sm7A2glcYIQueeeRnqOg5iwsCyCot747XKL5K9IKpbCZGk3Q78u/p/+zwsTrXmTXk6LzmhIXtMYgYk7d3nUKf1hl14wRuPOwle2uJv++eoPJ0dAEzuJV8DH1xw6s1esR2HLwpfvR30YAIZRG0r5hz0S9Yyt5m1+wfC1I8WuJZalwXaP2VmDdY0nUfFr0ONbx4ZDD1aMssSVVv5sz0fvyZEY7Uj1TkWgPhnqMCA5Ap0AvQAL3kOrDiY4y9CaCz4bozCbHMCZi7Zr1ABtraJclmKcsB+oJlANRjTYbvmQUnKPwGm9bI0Utlxu0m4rIbtor3xp7AKiHiqxIFBuSgFqvxbekRMnLKlhAxsLztEIemR/ASw1ZzopQrOPjd9sm4EMCVvwHJzIy0uyVcTF/MJqGsH0vDpYgyffnpnEs8/dw46uuQn+MVdOMi1uStpXloaXrK9mlMGK7zQySsbG2VNH4c7zMlcDjqTEDrQ1ydWJ6RZwEAWzuFPp67mPxIwKL1p0aCvHpN3yasMwktshPi0QQzrJKw6p1FPHB9+rhvqipyPeUmiKIO05SJLlCa9chYz/bOXXAjBRhcmrEyd7PPJdT9gWo1SB+t0Z1/kIMN0cqmpTAABdugwEF4es10rXmO3SDGVu5kxIeOmN/gEp1OC9kBLjvqOkyWFVmMDJXV8HkZoGlFnJJL2DZ4LbaBgC5W/nt1RXCGHjVO6auJs7LM/qtfCl6DmVAYGzwKagM7Bf0IxZpmRHN/KtU/YF+EwJIk5+yRFY1CY549SR3iOgYfk/qnKHZkSAEgb0j7GzRCn+oD8H+R8sTc9+PAB+OlUSAb+ji9Ywt3BqdVkPTvyObMEfRFpUcvZuJ98M/Jd1CBDYJ54KcQAAZ4OgLRNqh0pkXo3tyBWhgkTGg/WhL8LwhljiDRbw9vKMaezkSC5iCUSCCqhgs0kH/XRfApdnh+6X8hfHMSN9Bs+jq2GjyN56Qn9x1mavfBBvXz/uE7vQ2OW/D0fSHg7qgd1tnM3fVa0H3vA4zLj/96Sl/lXZR3etysBnkzzvZyjSWrC4/hNGvDaBRTb1GERMlfyCIdUcPHxZyo+pvvbQK7knkIOaIFNftw92DzGyd/lPqmH5XTopSixUoU0tDCWHRTjUbSfe7aq+AujMkdyzv3ZQI6oOa9hjcBF21kXIcpcRN//TYO+pPeBAGeBd6gh0dL9Xi7AU3Nj2gmCoVNYJSw2chIe7nLG8s64HHpvul8rKXPOifPcm0g+qwuotJtnMb4139qZxLHU5m61fjF/Jb6q8kkKgyPQDBjnaU1f3l83EP1hDm/YckDRTcOZaecP4Yt37PTWiMU8EkyKsZwsCv3BemwnFT++nwF4CT8MXy5haN6lR/bjgGpoUM6c0r8VqMEUrw0bEJI23doUmcbpldNPtgkN/81hBLkQwfxWlhAhaE1j9RgV1bbpiqOJKtRGMB3uTebFXp548BEAApItDlYuinSmY7QUxukvdsrxiQwRZ7mJ6ibSAKzOKYD/cPNZ5rHFjrhu7saHHtYTABYmwWb0z4Ky7A41zPSyz4DL6gIAQPDuaRFVNOx7W/4/5JE9q7c20kqNjEqCVpVJ/UsxFC7jPF7FGTqIkgkYlcaAABaIY5koCXf4aekDWVMHQ39EPIwArhGc3EPLB6euUyD7/54qKIrpZ/1nQkmbhy2SxKaFM78LzYX/aPNh6pcxntuQH2KXypNgpAPzFFgVcdrc03KQaJGtzry6ysYgCYdV7/BCdaAoyloXFgu2kBicGHQq24jYakC3E9YKzaSJOtyHkVR6BonSZjphjyVoz2yt78xPCnoB4NP+o1oBtV5nA7bekM5Lm6bCcmK/sK3tTGfrq0fAte9f7Ek2hszEmS2PGAn69hfx8oGqgRWmEry5JOrF1Hzy4sWOIiITRiteoMzCNVfop0S9ifo+Na8ZY24pBUSDzoOwqZDKSrYqk8/ok6TTZyJD9rL3YeQO+PkJ6uUzN7lshcLJcYw5G63IR+v/JppBiULQOseICL99JDpaY0eKf/4h+x7cics3cWSnrdoqDCYbdw4IbEIhUOydDzruWttQXg6RZRMLPzdwIempwYhWqsxEwiafcHlyok6fKywclwFIIT0CsY/gPzQu6VNva0XqrZX0a1b9Py0qjAXmATopzpwGv6F4JtKwrGR257nrwCBlOTksUDUAmy+J6D2+7Piip58AKNKBBt/UvrXV8DSya6f0oqP1pqPaXlt/re3z9AEtaKLZO6LThimAmCZjov4Kx6tKl3jUxsXwslPCR+lp/3beXudk0qDk/ffFxmDf134e9ovsjRiBIJuQel7Th4EQAtKs9vH7L6XswOib3JF3x1iR8M5rxuOxruRzWASLb0MbgFMu5tTowDOl4Jok/GXjjhyTsYNqG8Ko1NLKHYrA34zGQhdeBiyt/AmM03POeKq/MgtsCA91xLaGQzVn+mTQZ0K9CPipIBslANxzA2a5iJipqwG3Vth8QATNsNImPe3iiDJ6gbOQj/QIYnQIiOuTzKRsPvhpWZ+KOucsBjHOWAbuqV9tTAJwbx/UqUrHGid4H5C5KbhpjMKPc+YYjJBoDvCxFzDg2RUermGcJv5CE/5+94UM/pcVXEla52RsFfSOPnO62l9XF9b0dj2yeTdA55aWIyXuMvgczpbuNk97MGEJsHokEDknjpFD0c9HtrEX5uROIp+gEqc+MQw6U2Ieqpx2LAAdDpDicim3pEcfSLW+O3/7fKmzxDV35G3hBjrfrrjyOICZweOkiCdrMex27/QHVvnpvCsU8FMfxkAkQyb2hwQzzvn/f78K5FYZK7Gz8oceZyYWcVj+Q0lVsFHsb+uEVFxEPTLWd2v9Rw7QPPnf7wQCzBKpcoBXkuaOWS09HrRC+kfsPEzjeiLo7k16YUi55naXg/Fhfh5CRkwbEdAE1EpDK4nuS+rcA1KRClaCLWV+1b+MeNS8DmgnLnuDUN3J1pQfBB9j4cl7v0n5E8ZcXOwEmAK66Z1xu/3jWqb1ZmkXjx+MgPdWVohvhF8O2Yu7PrZ7juOoOlbAhycLC77EyAmcvXyNwd09uWtR31CFizRzsel0cWIEGQWMt+Rdsv2L9iRHeHE+ERiAxgQQoD60wYBacEExelpYKb3OOoHrylVm8lvDadUChEljWYxO1w2EzSL67UUBpFyS5FKbZH16w39so1gpdZMpIGiS6GJLi6lQZlMYh4FVO9mgFEjbeHOdw2CFR0eSQP0Wjxb4KphRoXxHOlgFh2bD51N/p3+i3iO/GPW0Rp8LePBbebfZ2abZ3rEpHgn5dWZRcNbkVDnuT+JBUn0RWAg+KnTJQMnU4WwYedSBBK+8BxQxhzasjEvH6R6ObOy6A72pQYR9gpLGTOQZPofD2WqU0oNUoVbCgMp6/+7lIoAIENtpK/f35TbvFhV7upddav+I7MjW54ofoDClM+7MhUAsT9KMbl19nABssUTDV5CdoK46Uj+fnJjzN2tZVrTdR8CUo9UiWwI+k0d4WjeN30I8dmh9mTYWd1+IEt0wZhRJwHq4IQhfXSIxSXj+dnmAsdU8x76UowK+56JmkonoPu8qIAm4DPlXYhPLI7NKFZh4IdPluRAvz0b/fHnzT2fSQzFPTRztTQvsBMxk/HlmmQWefwTb/CpYGfgCcgTBhnhMa+BIhXQYGTkcnVAMDThOA/jO2nL4bW42vNUJJUWUNqGqQuEy1Vg3A9um5RHYdAZbsDuyCJ+nUqS90se2w72a9nQDrF41i8cvcqRMpwm8/ilOpwFPGsFfdxmCZaAXL5N0gm4fbM2UgV1AUI9oLlTde0A4XYV+4luDykxiZ3GOjB16STqT1bT14Eocty6uQM3ZEqcYbAtJ3nZfH4Dlj83x3k9UmRnJzbekRgAAAAAAAAAAAAAAAAAAAAAAA=';
 let active=null,createBusy=false,saveBusy=false,seq=0;
 function info(text,kind=''){msg('ndMsg',text,kind);msg('ndActionMsg',text,kind)}
 function amountPreview(){
  const gross=Number(el('ndAmount').value||0),discount=Number(el('ndDiscount').value||0);
  el('ndTotal').value=money(Math.max(0,gross-discount));
 }
 function fill(row){
  active=row;
  el('ndNumber').textContent=row.numero;
  el('ndState').textContent=row.stato;
  for(const [id,key] of Object.entries({
   ndDate:'data_documento',ndServiceDate:'data_servizio',ndName:'intestatario',
   ndCF:'cf_piva',ndAddress:'indirizzo',ndCap:'cap',ndComune:'comune',
   ndProvincia:'provincia',ndEmail:'email',ndDescription:'descrizione',
   ndAmount:'importo',ndDiscount:'sconto',ndPayment:'modalita_pagamento',
   ndPayDate:'data_pagamento'
  }))el(id).value=row[key]??'';
  el('ndLinked').textContent='Foglio Viaggio '+row.numero_foglio;
  const draft=row.stato==='BOZZA';
  el('ndForm').querySelectorAll('input,textarea,select').forEach(node=>node.disabled=!draft);
  el('ndSave').classList.toggle('hidden',!draft);
  el('ndIssue').classList.toggle('hidden',!draft);
  el('ndPrint').disabled=false;
  el('ndEmailSend').disabled=false;
  el('ndPrint').title=draft?'Prima emetti la Nota di Debito per ottenere il documento definitivo.':'Stampa o salva la Nota di Debito in PDF.';
  el('ndEmailSend').title=draft?'Prima emetti la Nota di Debito.':'Invia automaticamente la Nota di Debito in PDF.';
  if(el('ndEmailStatus')){
   const es=row.email_stato||'NON_INVIATA';
   el('ndEmailStatus').textContent=es==='INVIATA'
    ?'Email inviata a '+(row.email_destinatario||row.email||'—')+' il '+niceDateTime(row.email_inviata_il)
    :es==='ERRORE'
      ?'Ultimo invio non riuscito'+(row.email_ultimo_errore?' · '+row.email_ultimo_errore:'')
      :'Email non ancora inviata.';
   el('ndEmailStatus').className='notice '+(es==='INVIATA'?'ok':es==='ERRORE'?'err':'');
  }
  el('ndNoDuplicate').textContent=draft
   ?'Bozza: controlla numerazione, intestatario, importo, sconto e dati di pagamento prima di emettere.'
   :'Nota emessa. Per correzioni successive rivolgersi all’Amministrazione.';
  amountPreview();
 }
 async function read(id){
  if(!isAdmin())return;
  info('Caricamento della Nota di Debito...');
  const r=await sb.from('note_di_debito').select('*').eq('id',id).single();
  if(r.error)return info(r.error.message,'err');
  fill(r.data);selectView('debitNoteDetail');info('');
  window.scrollTo({top:0,behavior:'smooth'});
 }
 window.ndOpen=read;
 async function getForFoglio(f){
  if(!isAdmin()||!f)return;
  const id=++seq;const box=el('ndFromSheet');
  if(!box)return;
  const closed=f.stato==='CHIUSO';
  box.classList.toggle('hidden',!closed);
  if(!closed)return;
  el('ndFromSheetButton').disabled=true;
  el('ndFromSheetButton').textContent='Verifica Nota di Debito...';
  const r=await sb.from('note_di_debito').select('id,numero,stato').eq('foglio_viaggio_id',f.id).maybeSingle();
  if(id!==seq)return;
  if(r.error){el('ndFromSheetButton').textContent='Errore: aggiorna la scheda';info(r.error.message,'err');return}
  if(r.data){
   el('ndFromSheetButton').textContent='Apri Nota di Debito '+r.data.numero+' · '+r.data.stato;
   el('ndFromSheetButton').disabled=false;
   el('ndFromSheetButton').onclick=()=>read(r.data.id);
   el('ndFromSheetInfo').textContent='Una sola Nota di Debito per Foglio Viaggio.';
  }else{
   el('ndFromSheetButton').textContent='✚ Crea Nota di Debito';
   el('ndFromSheetButton').disabled=false;
   el('ndFromSheetButton').onclick=()=>createFromSheet(f.id);
   el('ndFromSheetInfo').textContent='Creazione manuale, riservata all’Amministrazione.';
  }
 }
 window.ndRefreshForFoglio=getForFoglio;
 async function createFromSheet(id){
  if(!isAdmin()||createBusy||!id)return;
  if(!confirm('Creare UNA Nota di Debito in bozza collegata al Foglio Viaggio chiuso? Verifica che la numerazione non sia già stata usata nei documenti precedenti.'))return;
  createBusy=true;
  el('ndFromSheetButton').disabled=true;
  try{
   const r=await sb.rpc('cge_crea_nota_debito',{p_foglio:id});
   if(r.error)throw r.error;
   await read(r.data);
   info('Bozza creata. Controlla i dati prima di emetterla.','ok');
  }catch(e){el('ndFromSheetButton').disabled=false;info(e.message||String(e),'err')}
  finally{createBusy=false}
 }
 function payload(){
  const amount=Number(el('ndAmount').value),discount=Number(el('ndDiscount').value);
  const name=el('ndName').value.trim(),description=el('ndDescription').value.trim();
  if(!name||!description)throw new Error('Intestatario e descrizione sono obbligatori.');
  if(!Number.isFinite(amount)||!Number.isFinite(discount)||amount<0||discount<0||discount>amount)
   throw new Error('Controlla importo e sconto.');
  const email=el('ndEmail').value.trim();
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Indirizzo email non valido.');
  return {data_documento:el('ndDate').value,intestatario:name,cf_piva:el('ndCF').value.trim()||null,
   indirizzo:el('ndAddress').value.trim()||null,cap:el('ndCap').value.trim()||null,
   comune:el('ndComune').value.trim()||null,provincia:el('ndProvincia').value.trim()||null,
   email:email||null,descrizione:description,importo:amount,sconto:discount,
   modalita_pagamento:el('ndPayment').value||null,
   data_pagamento:el('ndPayDate').value||null,updated_at:new Date().toISOString()};
 }
 async function save(){
  if(!isAdmin()||!active||active.stato!=='BOZZA'||saveBusy)return false;
  let row;try{row=payload()}catch(e){info(e.message,'warn');return false}
  saveBusy=true;el('ndSave').disabled=true;el('ndIssue').disabled=true;
  info('Salvataggio della bozza in corso…');
  try{
   const r=await sb.from('note_di_debito').update(row).eq('id',active.id).eq('stato','BOZZA').select('*').single();
   if(r.error){info('Errore nel salvataggio: '+r.error.message,'err');return false}
   fill(r.data);info('Bozza salvata correttamente.','ok');return true;
  }catch(e){
   info('Errore nel salvataggio: '+(e.message||String(e)),'err');return false;
  }finally{
   saveBusy=false;
   if(active?.stato==='BOZZA'){el('ndSave').disabled=false;el('ndIssue').disabled=false}
  }
 }
 async function issue(){
  if(!isAdmin()||!active||active.stato!=='BOZZA')return info('La Nota di Debito non è più in stato BOZZA.','warn');
  if(!confirm('Emettere DEFINITIVAMENTE '+active.numero+'? Dopo l’emissione la Nota di Debito non sarà più modificabile.'))return;
  const ok=await save();
  if(!ok)return;
  info('Emissione della Nota di Debito in corso…');
  el('ndIssue').disabled=true;
  try{
   const r=await sb.rpc('cge_emetti_nota_debito',{p_id:active.id});
   if(r.error){info('Errore durante l’emissione: '+r.error.message,'err');el('ndIssue').disabled=false;return}
   await read(active.id);
   info('Nota di Debito emessa correttamente. Ora puoi usare Stampa / Salva PDF e Prepara email.','ok');
  }catch(e){
   info('Errore durante l’emissione: '+(e.message||String(e)),'err');
   if(active?.stato==='BOZZA')el('ndIssue').disabled=false;
  }
 }
 window.ndSaveDraft=save;
 window.ndIssueNote=issue;
 el('ndSave').onclick=save;
 el('ndIssue').onclick=issue;
 function printHtml(n){
  const line=(k,v)=>'<div class="nd-line"><b>'+safe(k)+':</b> '+safe(v||'—')+'</div>';
  return '<div class="print-page nd-print-page" style="font-family:Arial,sans-serif;color:#182c3a">'+
    '<div class="print-head nd-print-head"><img class="print-logo" src="'+LOGO_URL+'" alt="">'+
    '<div class="print-org"><h1>CROCE GIALLA EMERGENZA ODV</h1>'+
    '<div>Via I° Maggio 1 · 28040 Dormelletto (NO)</div>'+
    '<div>C.F. 91023880031 · P. IVA 02809130038</div>'+
    '<div>Tel. 0322 282730 · tesoreria@crocegiallaemergenza.it</div></div>'+
    '<div class="print-doc"><h2>NOTA DI DEBITO</h2><b>'+safe(n.numero)+'</b><div>'+niceDate(n.data_documento)+'</div></div></div>'+
    '<div class="print-box nd-print-box nd-recipient-box"><b>DESTINATARIO / INTESTATARIO</b>'+
    line('Nome e cognome / intestatario',n.intestatario)+line('C.F. / P. IVA',n.cf_piva)+
    line('Indirizzo',n.indirizzo)+line('CAP · Comune · Provincia',[n.cap,n.comune,n.provincia].filter(Boolean).join(' · '))+'</div>'+
    '<div class="print-box nd-print-box nd-service-box"><b>DETTAGLIO DEL SERVIZIO</b>'+
    line('Data servizio',niceDate(n.data_servizio))+line('Foglio Viaggio',n.numero_foglio)+
    '<div class="nd-description">'+safe(n.descrizione)+'</div></div>'+
    '<table class="nd-amount-table" border="1">'+
    '<thead><tr><th style="text-align:left">Descrizione</th><th>Prezzo</th><th>Sconto</th><th>Importo</th></tr></thead>'+
    '<tbody><tr><td>'+safe(n.descrizione)+'</td><td>'+money(n.importo)+'</td><td>'+money(n.sconto)+'</td><td>'+money(n.totale)+'</td></tr></tbody></table>'+
    '<div class="nd-total">TOTALE DA CORRISPONDERE: '+money(n.totale)+'</div>'+
    '<div class="print-box nd-print-box nd-payment-box"><b>MODALITÀ DI PAGAMENTO</b>'+
    line('Metodo',n.modalita_pagamento||'Da concordare')+
    line('Già pagato',n.data_pagamento?'Sì · '+niceDate(n.data_pagamento):'No')+
    line('Banca','UniCredit - filiale di Borgomanero')+
    '<div class="nd-iban">IBAN: IT84M0200845222000107312436</div>'+
    line('Causale',n.numero)+'</div>'+
    '<div class="nd-tax">Operazione senza applicazione dell’Iva ai sensi dell’art. 1, commi 54–89, L. 190/2014, come modificata dalle L. 208/2015 e L. 145/2018.<br>'+
    'Imposta di bollo: esente ai sensi dell’art. 82, comma 5, D.Lgs. 117/2017.</div>'+
    '<div class="nd-five"><img class="nd-five-img" src="'+FIVE_X1000_IMAGE+'" alt="Dona il tuo 5x1000"><div class="nd-five-cf">Sostieni Croce Gialla Emergenza ODV · C.F. <b>91023880031</b></div></div></div>';
 }
 el('ndPrint').onclick=()=>{
  if(!isAdmin()||!active)return info('Nota di Debito non disponibile.','warn');
  if(active.stato!=='EMESSA')return info('La Nota di Debito è ancora in BOZZA: premi prima “Emetti Nota di Debito”, poi potrai stamparla o salvarla in PDF.','warn');
  const print=el('printSheet'),oldTitle=document.title;
  document.body.classList.remove('print-roster','print-emergency','print-assistance');
  print.innerHTML=printHtml(active);
  print.classList.remove('hidden');document.title='Nota_di_Debito_'+active.numero;
  const restore=()=>{document.title=oldTitle;print.classList.add('hidden');window.removeEventListener('afterprint',restore)};
  window.addEventListener('afterprint',restore);window.print();
 };
 function ndWrapCanvas(ctx,text,maxWidth){
  const words=String(text??'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
  const lines=[];let line='';
  for(const word of words){
   const test=line?line+' '+word:word;
   if(line&&ctx.measureText(test).width>maxWidth){lines.push(line);line=word}else line=test;
  }
  if(line)lines.push(line);return lines.length?lines:['—'];
 }
 function ndCanvasLines(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){
  const lines=ndWrapCanvas(ctx,text,maxWidth).slice(0,maxLines);
  lines.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
  return y+lines.length*lineHeight;
 }
 function ndCanvasBox(ctx,x,y,w,h,title){
  ctx.fillStyle='#f8fafc';ctx.strokeStyle='#cfd9e1';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(x,y,w,h,12);ctx.fill();ctx.stroke();
  ctx.fillStyle='#12375d';ctx.font='700 22px Arial';ctx.fillText(title,x+20,y+34);
 }
 function ndCanvasField(ctx,label,value,x,y,maxWidth){
  ctx.fillStyle='#182c3a';ctx.font='700 18px Arial';ctx.fillText(label+':',x,y);
  const labelW=ctx.measureText(label+': ').width;
  ctx.font='400 18px Arial';
  ctx.fillText(String(value||'—'),x+labelW,y);
 }
 function ndLoadImage(src){
  return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src});
 }
 async function buildNoteEmailPageJpeg(n){
  const W=1240,H=1754,m=62,navy='#12375d',yellow='#e6c741',ink='#182c3a';
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.textBaseline='alphabetic';

  ctx.fillStyle=yellow;ctx.beginPath();ctx.arc(m+42,82,38,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=navy;ctx.font='800 20px Arial';ctx.textAlign='center';ctx.fillText('CGE',m+42,89);
  ctx.textAlign='left';ctx.fillStyle=navy;ctx.font='800 31px Arial';ctx.fillText('CROCE GIALLA EMERGENZA ODV',m+102,61);
  ctx.fillStyle=ink;ctx.font='400 16px Arial';
  ctx.fillText('Via I° Maggio 1 · 28040 Dormelletto (NO)',m+102,88);
  ctx.fillText('C.F. 91023880031 · P. IVA 02809130038',m+102,112);
  ctx.fillText('Tel. 0322 282730 · tesoreria@crocegiallaemergenza.it',m+102,136);
  ctx.textAlign='right';ctx.fillStyle=navy;ctx.font='800 27px Arial';ctx.fillText('NOTA DI DEBITO',W-m,61);
  ctx.font='700 20px Arial';ctx.fillText(String(n.numero||''),W-m,91);
  ctx.font='400 17px Arial';ctx.fillText(niceDate(n.data_documento),W-m,118);
  ctx.strokeStyle=navy;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(m,158);ctx.lineTo(W-m,158);ctx.stroke();
  ctx.textAlign='left';

  let y=180,boxW=W-m*2;
  ndCanvasBox(ctx,m,y,boxW,220,'DESTINATARIO / INTESTATARIO');
  ctx.fillStyle=ink;
  ndCanvasField(ctx,'Nome e cognome / intestatario',n.intestatario,m+24,y+72,boxW-48);
  ndCanvasField(ctx,'C.F. / P. IVA',n.cf_piva,m+24,y+108,boxW-48);
  ndCanvasField(ctx,'Indirizzo',n.indirizzo,m+24,y+144,boxW-48);
  ndCanvasField(ctx,'CAP · Comune · Provincia',[n.cap,n.comune,n.provincia].filter(Boolean).join(' · '),m+24,y+180,boxW-48);

  y+=238;
  ndCanvasBox(ctx,m,y,boxW,310,'DETTAGLIO DEL SERVIZIO');
  ctx.fillStyle=ink;
  ndCanvasField(ctx,'Data servizio',niceDate(n.data_servizio),m+24,y+72,boxW-48);
  ndCanvasField(ctx,'Foglio Viaggio',n.numero_foglio,m+24,y+108,boxW-48);
  ctx.font='400 18px Arial';
  ndCanvasLines(ctx,n.descrizione,m+24,y+150,boxW-48,25,5);

  y+=330;
  const tw=boxW,cols=[tw*.58,tw*.14,tw*.14,tw*.14];
  ctx.strokeStyle='#aebbc5';ctx.lineWidth=2;ctx.fillStyle='#f3f6f8';ctx.fillRect(m,y,tw,48);ctx.strokeRect(m,y,tw,118);
  let cx=m;
  const heads=['Descrizione','Prezzo','Sconto','Importo'];
  ctx.fillStyle=navy;ctx.font='700 17px Arial';
  for(let i=0;i<4;i++){ctx.fillText(heads[i],cx+12,y+31);if(i<3){cx+=cols[i];ctx.beginPath();ctx.moveTo(cx,y);ctx.lineTo(cx,y+118);ctx.stroke()}}
  ctx.fillStyle=ink;ctx.font='400 16px Arial';ctx.fillText(String(n.descrizione||'').slice(0,78),m+12,y+82);
  cx=m+cols[0];ctx.fillText(money(n.importo),cx+12,y+82);cx+=cols[1];ctx.fillText(money(n.sconto),cx+12,y+82);cx+=cols[2];ctx.fillText(money(n.totale),cx+12,y+82);

  y+=140;
  ctx.strokeStyle=navy;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(m,y);ctx.lineTo(W-m,y);ctx.stroke();
  ctx.fillStyle=navy;ctx.font='800 31px Arial';ctx.textAlign='right';ctx.fillText('TOTALE DA CORRISPONDERE: '+money(n.totale),W-m,y+49);
  ctx.beginPath();ctx.moveTo(m,y+68);ctx.lineTo(W-m,y+68);ctx.stroke();ctx.textAlign='left';

  y+=90;
  ndCanvasBox(ctx,m,y,boxW,290,'MODALITÀ DI PAGAMENTO');
  ctx.fillStyle=ink;
  ndCanvasField(ctx,'Metodo',n.modalita_pagamento||'Da concordare',m+24,y+72,boxW-48);
  ndCanvasField(ctx,'Già pagato',n.data_pagamento?'Sì · '+niceDate(n.data_pagamento):'No',m+24,y+108,boxW-48);
  ndCanvasField(ctx,'Banca','UniCredit - filiale di Borgomanero',m+24,y+144,boxW-48);
  ctx.font='800 23px Arial';ctx.fillText('IBAN: IT84M0200845222000107312436',m+24,y+190);
  ctx.font='700 18px Arial';ctx.fillText('Causale:',m+24,y+232);ctx.font='400 18px Arial';ctx.fillText(String(n.numero||'—'),m+112,y+232);

  y+=314;
  ctx.fillStyle=ink;ctx.font='400 13px Arial';
  ndCanvasLines(ctx,'Operazione senza applicazione dell’Iva ai sensi dell’art. 1, commi 54–89, L. 190/2014, come modificata dalle L. 208/2015 e L. 145/2018.',m,y,boxW,19,3);
  ndCanvasLines(ctx,'Imposta di bollo: esente ai sensi dell’art. 82, comma 5, D.Lgs. 117/2017.',m,y+52,boxW,19,2);

  try{
   const img=await ndLoadImage(FIVE_X1000_IMAGE);
   const targetW=475,targetH=targetW*(img.height/img.width),ix=(W-targetW)/2,iy=H-targetH-80;
   ctx.drawImage(img,ix,iy,targetW,targetH);
   ctx.fillStyle=ink;ctx.font='700 16px Arial';ctx.textAlign='center';
   ctx.fillText('Sostieni Croce Gialla Emergenza ODV · C.F. 91023880031',W/2,H-42);
   ctx.textAlign='left';
  }catch(_){
   ctx.strokeStyle=yellow;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(m,H-110);ctx.lineTo(W-m,H-110);ctx.stroke();
   ctx.fillStyle=ink;ctx.font='700 18px Arial';ctx.textAlign='center';ctx.fillText('Dona il tuo 5×1000 · C.F. 91023880031',W/2,H-70);ctx.textAlign='left';
  }
  return c.toDataURL('image/jpeg',0.92).split(',')[1];
 }
 async function invokeNoteEmail(notaId,pageJpegBase64){
  const s=await sb.auth.getSession(),token=s.data.session?.access_token;
  if(!token)throw new Error('Sessione amministratore scaduta. Esci e accedi di nuovo.');
  const r=await sb.functions.invoke('invia-nota-debito-email',{
   body:{nota_id:notaId,page_jpeg_base64:pageJpegBase64},
   headers:{Authorization:'Bearer '+token}
  });
  if(r.error){
   let detail=r.error.message||'Errore invio email';
   try{if(r.error.context&&typeof r.error.context.json==='function'){const body=await r.error.context.json();if(body?.error)detail=body.error}}catch(_){}
   throw new Error(detail);
  }
  if(r.data?.error)throw new Error(r.data.error);
  return r.data||{};
 }
 el('ndEmailSend').onclick=async()=>{
  if(!isAdmin()||!active)return info('Nota di Debito non disponibile.','warn');
  if(active.stato!=='EMESSA')return info('La Nota di Debito è ancora in BOZZA: emettila prima dell’invio.','warn');
  if(!active.email)return info('Inserisci l’indirizzo email corretto quando la nota è ancora in bozza.','warn');
  if(active.email_stato==='INVIATA'&&!confirm('Questa Nota di Debito risulta già inviata il '+niceDateTime(active.email_inviata_il)+'. Vuoi reinviarla a '+active.email+'?'))return;
  if(active.email_stato!=='INVIATA'&&!confirm('Inviare ora la Nota di Debito '+active.numero+' in PDF a '+active.email+' da tesoreria@crocegiallaemergenza.it?'))return;
  const b=el('ndEmailSend'),old=b.textContent;b.disabled=true;b.textContent='Invio in corso…';info('Preparazione PDF e invio email in corso…');
  try{
   const jpg=await buildNoteEmailPageJpeg(active);
   const result=await invokeNoteEmail(active.id,jpg);
   info('Email inviata correttamente a '+result.destinatario+'.','ok');
   await read(active.id);
  }catch(e){
   info(e.message||String(e),'err');
  }finally{
   b.disabled=false;b.textContent=old;
  }
 };
 if(el('ndEmailClient'))el('ndEmailClient').onclick=()=>{
  if(!active?.email)return info('Indirizzo email destinatario mancante.','warn');
  const subject='Croce Gialla Emergenza ODV – Nota di Debito '+active.numero;
  const body='Gentile destinatario,\n\nin allegato la Nota di Debito '+active.numero+
   ' relativa al servizio del '+niceDate(active.data_servizio)+
   '.\n\nCordiali saluti,\nCroce Gialla Emergenza ODV\ntesoreria@crocegiallaemergenza.it';
  location.href='mailto:'+encodeURIComponent(active.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 };
 el('ndBack').onclick=()=>view('debitNotes');
 el('ndFromSheetOpenList').onclick=()=>view('debitNotes');
 async function list(){
  if(!isAdmin())return;
  const r=await sb.from('note_di_debito').select('id,numero,data_documento,intestatario,totale,stato,numero_foglio').order('created_at',{ascending:false}).limit(500);
  if(r.error)return msg('ndListMsg',r.error.message,'err');
  el('ndRows').innerHTML=(r.data||[]).length?r.data.map(n=>'<tr><td><b>'+safe(n.numero)+'</b></td><td>'+safe(niceDate(n.data_documento))+'</td>'+
    '<td>'+safe(n.intestatario)+'</td><td>'+safe(n.numero_foglio)+'</td><td>'+money(n.totale)+'</td><td>'+safe(n.stato)+'</td>'+
    '<td><button class="btn secondary" type="button" data-nd-open="'+safe(n.id)+'">Apri</button></td></tr>').join(''):
    '<tr><td colspan="7">Nessuna Nota di Debito registrata.</td></tr>';
  el('ndRows').querySelectorAll('[data-nd-open]').forEach(b=>b.onclick=()=>read(b.dataset.ndOpen));
  msg('ndListMsg','');
 }
 window.ndLoadList=list;
 el('ndRefresh').onclick=list;
 el('ndAmount').oninput=amountPreview;el('ndDiscount').oninput=amountPreview;
})();
