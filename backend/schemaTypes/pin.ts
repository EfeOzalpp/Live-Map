export default {
  name: 'pin',
  title: 'pin',
  type: 'document',
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'lat',
      title: 'Latitude',
      type: 'number',
    },
    {
      name: 'lng',
      title: 'Longitude',
      type: 'number',
    },
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'emoji',
      title: 'Emoji',
      type: 'string',
    },
  ],
};
